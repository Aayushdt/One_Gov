import { prisma } from '../config/db';
import { ConsentStatus } from '@prisma/client';
import IORedis from 'ioredis';

export class NotificationService {
  private redis: IORedis | null = null;

  constructor(redisClient?: IORedis) {
    if (redisClient) {
      this.redis = redisClient;
    }
  }

  private getRedis(): IORedis {
    if (!this.redis) {
      this.redis = new IORedis(process.env.REDIS_URL ?? 'redis://redis:6379', {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        lazyConnect: true,
      });
    }
    return this.redis;
  }

  /**
   * Emits a notification record to the database for a citizen and publishes to Redis.
   */
  async emitNotification(params: {
    citizenId: string;
    type: string;
    title: string;
    body: string;
    metadata?: any;
  }) {
    const created = await prisma.notification.create({
      data: {
        citizenId: params.citizenId,
        type: params.type,
        title: params.title,
        body: params.body,
        metadata: params.metadata ?? null,
      },
    });

    try {
      const client = this.getRedis();
      if (client.status === 'wait') {
        await client.connect().catch(() => {});
      }
      await client.publish(
        `govlink:notifications:${params.citizenId}`,
        JSON.stringify(created)
      );
    } catch {
      // Non-blocking if Redis is unreachable in unit tests
    }

    return created;
  }

  async close() {
    if (this.redis) {
      await this.redis.quit().catch(() => {});
      this.redis = null;
    }
  }

  // Alias for backward compatibility with Item 2 stub
  async createNotification(params: {
    citizenId: string;
    type: string;
    title: string;
    body: string;
    metadata?: any;
  }) {
    return this.emitNotification(params);
  }

  /**
   * Retrieves notifications for a citizen, optionally filtering for unread only.
   */
  async getCitizenNotifications(
    citizenId: string,
    options?: { unreadOnly?: boolean; limit?: number }
  ) {
    const where: any = { citizenId };
    if (options?.unreadOnly) {
      where.readAt = null;
    }

    return prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit ?? 50,
    });
  }

  /**
   * Gets the unread notification count for a citizen.
   */
  async getUnreadCount(citizenId: string): Promise<number> {
    return prisma.notification.count({
      where: { citizenId, readAt: null },
    });
  }

  /**
   * Marks a specific notification as read.
   */
  async markRead(notificationId: string, citizenId: string) {
    return prisma.notification.updateMany({
      where: { id: notificationId, citizenId },
      data: { readAt: new Date() },
    });
  }

  /**
   * Marks all unread notifications for a citizen as read.
   */
  async markAllRead(citizenId: string) {
    return prisma.notification.updateMany({
      where: { citizenId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  /**
   * Scans active consent artefacts expiring within 7 days and emits deduplicated alerts.
   */
  async checkAndNotifyExpiringConsents(): Promise<{ checked: number; notified: number }> {
    const now = new Date();
    const inSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const expiringArtefacts = await prisma.consentArtefact.findMany({
      where: {
        status: ConsentStatus.ACTIVE,
        expiresAt: {
          gt: now,
          lte: inSevenDays,
        },
      },
    });

    let notified = 0;

    for (const artefact of expiringArtefacts) {
      // Deduplication: check if an alert for this run and category was created in the last 7 days
      const existing = await prisma.notification.findFirst({
        where: {
          citizenId: artefact.citizenId,
          type: 'CONSENT_EXPIRING',
          createdAt: { gte: sevenDaysAgo },
          metadata: {
            path: ['category'],
            equals: artefact.category,
          },
        },
      });

      if (!existing) {
        await this.emitNotification({
          citizenId: artefact.citizenId,
          type: 'CONSENT_EXPIRING',
          title: `Consent Expiring Soon: ${artefact.category}`,
          body: `Your authorized consent for ${artefact.category} will expire on ${artefact.expiresAt.toLocaleDateString()}. Please renew if needed.`,
          metadata: {
            runId: artefact.workflowRunId,
            category: artefact.category,
            expiresAt: artefact.expiresAt.toISOString(),
          },
        });
        notified++;
      }
    }

    return { checked: expiringArtefacts.length, notified };
  }
}

export const notificationService = new NotificationService();
