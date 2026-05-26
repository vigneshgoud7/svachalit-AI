import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '../config/env';

// Reuse Redis connection across queue and workers
export const redisConnection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null, // Required by BullMQ
});

// Create the message processing queue
export const messageQueue = new Queue('incoming-messages', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3, // Retry on external system API timeouts/rate limits
    backoff: {
      type: 'exponential',
      delay: 2000, // Wait 2s, 4s, 8s
    },
    removeOnComplete: true, // Keep clean
    removeOnFail: 100, // Keep last 100 errors for diagnostics
  },
});
