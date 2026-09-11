import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL ?? 'redis://redis:6379', { maxRetriesPerRequest: null });

export const workflowRetryQueue = new Queue('workflow-retry', { connection });

// Worker is initialized lazily to avoid circular imports
export function startWorker() {
  const { workflowEngine } = require('./engine');
  new Worker('workflow-retry', async (job) => {
    await workflowEngine.advance(job.data.runId);
  }, { connection });
  console.log('BullMQ worker started');
}
