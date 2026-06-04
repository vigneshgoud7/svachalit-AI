import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
<<<<<<< HEAD
  NODE_ENV: process.env.NODE_ENV || 'development',
=======
>>>>>>> 765969bd30239688115f15de9bc845dfa0e7665c
  PORT: parseInt(process.env.PORT || '4000', 10),
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/multichannel_db?schema=public',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
  META_VERIFY_TOKEN: process.env.META_VERIFY_TOKEN || 'multichannel_verify_token_123',
  JWT_SECRET: process.env.JWT_SECRET || 'super-secret-key-change-me',
<<<<<<< HEAD
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  PUBLIC_API_URL: process.env.PUBLIC_API_URL || 'http://localhost:4000',
  REQUIRE_AUTH: process.env.REQUIRE_AUTH === 'true',
  DISABLE_DEV_SEED: process.env.DISABLE_DEV_SEED === 'true',
  GOOGLE_SHEETS_WEBHOOK_URL: process.env.GOOGLE_SHEETS_WEBHOOK_URL || '',
  CALENDAR_WEBHOOK_URL: process.env.CALENDAR_WEBHOOK_URL || '',
  RESPONSE_CACHE_TTL_SECONDS: parseInt(process.env.RESPONSE_CACHE_TTL_SECONDS || '300', 10),
=======
>>>>>>> 765969bd30239688115f15de9bc845dfa0e7665c
};
