import { Queue } from 'bullmq';
import { redisConnection } from '../../lib/redis.js';

export const HEALTH_CHECK_QUEUE_NAME = 'service-health-checks';

export interface HealthCheckJobData {
  serviceId: string;
}

export const healthCheckQueue = new Queue<HealthCheckJobData>(HEALTH_CHECK_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: 10, // Keep last 100 successful job traces in Redis
    removeOnFail: 20,     // Keep last 200 failed job traces for debugging
  },
});