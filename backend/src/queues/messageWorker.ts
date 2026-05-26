import { Worker, Job } from 'bullmq';
import { redisConnection } from './messageQueue';
import { AIOrchestrator } from '../services/aiOrchestrator';
import { InboundMessagePayload } from '../types';

// Define the worker processing incoming messages
export const messageWorker = new Worker(
  'incoming-messages',
  async (job: Job<InboundMessagePayload>) => {
    console.log(`[Worker] Starting job ${job.id} - Ingesting channel message from sender: ${job.data.senderId}`);
    try {
      await AIOrchestrator.processMessage(job.data);
      console.log(`[Worker] Successfully completed job ${job.id}`);
    } catch (error) {
      console.error(`[Worker] Job ${job.id} failed with error:`, error);
      throw error; // Propagate error so BullMQ handles automatic retries and backoff
    }
  },
  {
    connection: redisConnection,
    concurrency: 10, // Process up to 10 incoming messages concurrently
  }
);

messageWorker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed permanently: ${err.message}`);
});

messageWorker.on('error', (err) => {
  console.error('[Worker] Global connection or setup error:', err);
});
