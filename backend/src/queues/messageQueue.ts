import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '../config/env';

<<<<<<< HEAD
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
=======
// Reuse Redis connection across queue and workers
export const redisConnection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  tls: {
    rejectUnauthorized: false,
  },
>>>>>>> 765969bd30239688115f15de9bc845dfa0e7665c
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
<<<<<<< HEAD
});
=======
});
>>>>>>> 765969bd30239688115f15de9bc845dfa0e7665c
