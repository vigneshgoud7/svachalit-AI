import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  PORT: parseInt(process.env.PORT || '4000', 10),
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/multichannel_db?schema=public',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  JWT_SECRET: process.env.JWT_SECRET || 'super-secret-key-change-me',
};
