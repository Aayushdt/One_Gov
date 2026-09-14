import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { prisma } from '../../config/db';
import { notificationService } from '../notification.service';
import { consentService } from '../../consent/consent.service';
import { DataCategory, ConsentStatus } from '@prisma/client';

describe('Notification Service & Event Delivery Tests', () => {
  const testCitizenId = 'citizen-test-notifications';
  const testRunId = 'run-test-notifications-1';

  before(async () => {
    // Setup test citizen and workflow run
    await prisma.citizen.upsert({
      where: { id: testCitizenId },
      update: {},
      create: {
        id: testCitizenId,
        onegovId: 'OG-NOTIF-9999',
        email: 'notif.test@govlink.demo',
        passwordHash: 'dummy',
        name: 'Notification Test Citizen',
      },
    });

    await prisma.workflowRun.upsert({
      where: { id: testRunId },
      update: {},
      create: {
        id: testRunId,
        citizenId: testCitizenId,
        serviceType: 'SCHOLARSHIP',
      },
    });
  });

  after(async () => {
    try {
      await prisma.notification.deleteMany({ where: { citizenId: testCitizenId } });
      await prisma.consentArtefact.deleteMany({ where: { citizenId: testCitizenId } });
      await prisma.workflowRun.deleteMany({ where: { id: testRunId } });
      await prisma.citizen.deleteMany({ where: { id: testCitizenId } });
    } catch {}
  });

  it('should emit, fetch, and mark read notifications', async () => {
    // 1. Emit a test notification
    const created = await notificationService.emitNotification({
      citizenId: testCitizenId,
      type: 'TEST_ALERT',
      title: 'Welcome Alert',
      body: 'Testing notification creation',
      metadata: { testKey: 'testVal' },
    });

    assert.ok(created.id);
    assert.strictEqual(created.citizenId, testCitizenId);
    assert.strictEqual(created.readAt, null);

    // 2. Fetch unread count and notifications
    let unreadCount = await notificationService.getUnreadCount(testCitizenId);
    assert.strictEqual(unreadCount, 1);

    const list = await notificationService.getCitizenNotifications(testCitizenId, { unreadOnly: true });
    assert.strictEqual(list.length, 1);
    assert.strictEqual(list[0].id, created.id);

    // 3. Mark read
    await notificationService.markRead(created.id, testCitizenId);
    unreadCount = await notificationService.getUnreadCount(testCitizenId);
    assert.strictEqual(unreadCount, 0);

    const unreadList = await notificationService.getCitizenNotifications(testCitizenId, { unreadOnly: true });
    assert.strictEqual(unreadList.length, 0);

    const allList = await notificationService.getCitizenNotifications(testCitizenId);
    assert.strictEqual(allList.length, 1);
    assert.ok(allList[0].readAt !== null);
  });

  it('should detect expiring consents and deduplicate alerts within 7 days', async () => {
    // 1. Create a consent expiring in 3 days
    const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    await prisma.consentArtefact.upsert({
      where: { workflowRunId_category: { workflowRunId: testRunId, category: DataCategory.INCOME } },
      update: {
        status: ConsentStatus.ACTIVE,
        expiresAt,
        citizenId: testCitizenId,
      },
      create: {
        citizenId: testCitizenId,
        workflowRunId: testRunId,
        category: DataCategory.INCOME,
        purpose: 'Income verification',
        requestedBy: 'Test Runner',
        status: ConsentStatus.ACTIVE,
        expiresAt,
      },
    });

    // 2. Run first scan -> should emit alert
    const firstScan = await notificationService.checkAndNotifyExpiringConsents();
    assert.ok(firstScan.checked >= 1);
    assert.ok(firstScan.notified >= 1);

    const notifications = await notificationService.getCitizenNotifications(testCitizenId);
    const expiringAlert = notifications.find((n) => n.type === 'CONSENT_EXPIRING' && (n.metadata as any)?.category === 'INCOME');
    assert.ok(expiringAlert, 'Should find CONSENT_EXPIRING alert');
    assert.strictEqual(expiringAlert.title, 'Consent Expiring Soon: INCOME');

    // 3. Run second scan immediately -> deduplication should prevent second alert
    const secondScan = await notificationService.checkAndNotifyExpiringConsents();
    const notificationsAfter = await notificationService.getCitizenNotifications(testCitizenId);
    const countAfter = notificationsAfter.filter((n) => n.type === 'CONSENT_EXPIRING' && (n.metadata as any)?.category === 'INCOME').length;
    assert.strictEqual(countAfter, 1, 'Should have exactly 1 expiring alert for INCOME (deduplicated)');
  });

  it('should emit CONSENT_REVOKED notification when consent is revoked', async () => {
    // Revoke INCOME consent
    await consentService.revokeConsent(testRunId, testCitizenId, DataCategory.INCOME);

    const notifications = await notificationService.getCitizenNotifications(testCitizenId);
    const revokeAlert = notifications.find((n) => n.type === 'CONSENT_REVOKED');
    assert.ok(revokeAlert, 'Should find CONSENT_REVOKED alert');
    assert.strictEqual(revokeAlert.title, 'Consent Revoked: INCOME');
  });
});
