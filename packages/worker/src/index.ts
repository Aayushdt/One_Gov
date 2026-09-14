import { Worker, Queue } from 'bullmq';
import IORedis from 'ioredis';
import { workflowEngine } from '../../backend/src/workflow/engine';
import { notificationService } from '../../backend/src/notifications/notification.service';
import { retentionService } from '../../backend/src/retention/retention.service';
import { prisma } from '../../backend/src/config/db';

const redisUrl = process.env.REDIS_URL ?? 'redis://redis:6379';
const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });

console.log('==> Starting decoupled GovLink BullMQ Worker process...');
console.log(`    Connecting to Redis: ${redisUrl}`);

const worker = new Worker(
  'workflow-retry',
  async (job) => {
    console.log(`[Worker] Picked up retry job ${job.id} for runId: ${job.data.runId}`);
    try {
      await workflowEngine.advance(job.data.runId);
      console.log(`[Worker] Successfully advanced runId: ${job.data.runId}`);
    } catch (err: any) {
      console.error(`[Worker] Failed advancing runId ${job.data.runId}:`, err.message);
      throw err;
    }
  },
  {
    connection,
    concurrency: 5,
  }
);

worker.on('ready', () => {
  console.log('✅ BullMQ Worker ready and listening for retry jobs on queue: workflow-retry');
});

worker.on('error', (err) => {
  console.error('❌ BullMQ Worker error:', err);
});

worker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} completed.`);
});

worker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed with error:`, err.message);
});

// Item 5 & Item 13: Scheduled Cron Job for Expiring Consents & Retention Purge
const cronQueue = new Queue('cron-jobs', { connection });

const cronWorker = new Worker(
  'cron-jobs',
  async (job) => {
    if (job.name === 'check-expiring-consents') {
      console.log('[CronWorker] Running check-expiring-consents...');
      const res = await notificationService.checkAndNotifyExpiringConsents();
      console.log(`[CronWorker] Checked ${res.checked} active consents, generated ${res.notified} expiration warnings.`);
    } else if (job.name === 'apply-data-retention') {
      console.log('[CronWorker] Running apply-data-retention...');
      const res = await retentionService.applyRetention();
      console.log(`[CronWorker] Retention executed: purged ${res.cleanedRunsCount} runs, protected ${res.excludedDueToAppeals} runs with pending appeals.`);
    }
  },
  { connection }
);

async function initCron() {
  try {
    // Schedule repeatable consent check every hour
    await cronQueue.add(
      'check-expiring-consents',
      {},
      {
        repeat: {
          every: 60 * 60 * 1000,
        },
        jobId: 'repeat-expiring-consents',
      }
    );

    // Schedule repeatable data retention job daily
    await cronQueue.add(
      'apply-data-retention',
      {},
      {
        repeat: {
          every: 24 * 60 * 60 * 1000,
        },
        jobId: 'repeat-data-retention',
      }
    );

    // Also run initial startup checks
    const initialExp = await notificationService.checkAndNotifyExpiringConsents();
    console.log(`[CronWorker] Initial consent check: checked ${initialExp.checked}, notified ${initialExp.notified}`);

    const initialRet = await retentionService.applyRetention();
    console.log(`[CronWorker] Initial retention check: purged ${initialRet.cleanedRunsCount} runs, protected ${initialRet.excludedDueToAppeals} active appeals.`);
  } catch (err) {
    console.error('[CronWorker] Error initializing cron repeatable jobs:', err);
  }
}

initCron();

const shutdown = async () => {
  console.log('\n==> Worker shutting down gracefully...');
  await worker.close();
  await connection.quit();
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
