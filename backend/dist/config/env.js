"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
exports.env = {
    PORT: parseInt(process.env.PORT || '4000', 10),
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/multichannel_db?schema=public',
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
    META_VERIFY_TOKEN: process.env.META_VERIFY_TOKEN || 'multichannel_verify_token_123',
    JWT_SECRET: process.env.JWT_SECRET || 'super-secret-key-change-me',
};
