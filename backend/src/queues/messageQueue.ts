import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '../config/env';

const redisUsesTls = env.REDIS_URL.startsWith('rediss://');

// Reuse Redis connection across queue and workers
export const redisConnection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  ...(redisUsesTls
    ? {
        tls: {
          rejectUnauthorized: false,
        },
      }
    : {}),
  enableReadyCheck: false,
  lazyConnect: true,
});

// Create the message processing queue
export const messageQueue = new Queue('incoming-messages', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: 100,
  },
});
