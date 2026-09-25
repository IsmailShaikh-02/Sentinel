import { Redis } from 'ioredis';
import { env } from '../env.js';

export const redisConnection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

redisConnection.on('connect', () => {
  console.log('✅ Connected to Redis');
});

redisConnection.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
});