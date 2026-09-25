// src/env.ts
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters long'),
  BREVO_API_KEY: z.string().min(1, 'BREVO_API_KEY is required'),
  BREVO_SENDER_EMAIL: z.string().email('BREVO_SENDER_EMAIL must be a valid email'),
  BREVO_SENDER_NAME: z.string().min(1, 'BREVO_SENDER_NAME is required')
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

export const env = parsed.data;