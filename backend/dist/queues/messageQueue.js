"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageQueue = exports.redisConnection = void 0;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = require("../config/env");
// Reuse Redis connection across queue and workers
exports.redisConnection = new ioredis_1.default(env_1.env.REDIS_URL, {
    maxRetriesPerRequest: null, // Required by BullMQ
});
// Create the message processing queue
exports.messageQueue = new bullmq_1.Queue('incoming-messages', {
    connection: exports.redisConnection,
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
