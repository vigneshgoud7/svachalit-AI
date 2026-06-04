"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageWorker = void 0;
const bullmq_1 = require("bullmq");
const messageQueue_1 = require("./messageQueue");
const aiOrchestrator_1 = require("../services/aiOrchestrator");
// Define the worker processing incoming messages
exports.messageWorker = new bullmq_1.Worker('incoming-messages', async (job) => {
    console.log(`[Worker] Starting job ${job.id} - Ingesting channel message from sender: ${job.data.senderId}`);
    try {
        await aiOrchestrator_1.AIOrchestrator.processMessage(job.data);
        console.log(`[Worker] Successfully completed job ${job.id}`);
    }
    catch (error) {
        console.error(`[Worker] Job ${job.id} failed with error:`, error);
        throw error; // Propagate error so BullMQ handles automatic retries and backoff
    }
}, {
    connection: messageQueue_1.redisConnection,
    concurrency: 10, // Process up to 10 incoming messages concurrently
});
exports.messageWorker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed permanently: ${err.message}`);
});
exports.messageWorker.on('error', (err) => {
    console.error('[Worker] Global connection or setup error:', err);
});
