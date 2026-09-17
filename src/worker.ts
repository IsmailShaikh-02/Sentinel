import { Worker, Job } from 'bullmq';
import { pool } from './db/pool.js';
import { redisConnection } from './lib/redis.js';
import { HEALTH_CHECK_QUEUE_NAME, HealthCheckJobData } from './modules/scheduler/queue.js';
import { probeUrl } from './modules/services/checker.js';

interface ServiceTarget {
  id: string;
  url: string;
  method: string;
  expected_status: number;
  enabled: boolean;
}

/**
 * Fetches service details from PostgreSQL.
 * Returns null if service was deleted or disabled.
 */
async function getTargetService(serviceId: string): Promise<ServiceTarget | null> {
  const result = await pool.query<ServiceTarget>(
    `SELECT id, url, method, expected_status, enabled
     FROM services
     WHERE id = $1`,
    [serviceId]
  );

  if (result.rows.length === 0 || !result.rows[0].enabled) {
    return null;
  }

  return result.rows[0];
}

/**
 * Core processor for service health check jobs
 */
async function processHealthCheckJob(job: Job<HealthCheckJobData>): Promise<void> {
  const { serviceId } = job.data;

  // 1. Check if service still exists and is enabled
  const service = await getTargetService(serviceId);
  if (!service) {
    console.log(`[Worker] Service ${serviceId} not found or disabled; skipping check.`);
    return;
  }

  // 2. Perform probe with 5-second network timeout
  const probe = await probeUrl(service.url, service.method, service.expected_status, 5000);

  // 3. Insert check probe into Postgres as an append-only event
  await pool.query(
    `INSERT INTO checks (service_id, status_code, response_time_ms, ok)
     VALUES ($1, $2, $3, $4)`,
    [service.id, probe.statusCode, probe.responseTimeMs, probe.ok]
  );

  // 4. Log progress
  const statusLabel = probe.statusCode !== null ? `${probe.statusCode}` : 'TIMEOUT/ERROR';
  console.log(
    `[Worker] Checked ${service.url} -> ${statusLabel} (${probe.responseTimeMs}ms) [ok: ${probe.ok}]`
  );
}

// Instantiate BullMQ Worker
export const worker = new Worker<HealthCheckJobData>(
  HEALTH_CHECK_QUEUE_NAME,
  processHealthCheckJob,
  {
    connection: redisConnection,
    concurrency: 5, // Run up to 5 concurrent probes
  }
);

worker.on('ready', () => {
  console.log(`🚀 Sentinel Background Worker active on queue "${HEALTH_CHECK_QUEUE_NAME}"`);
});

worker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed with error:`, err);
});

// Graceful shutdown handling
const shutdown = async (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Closing worker and database connections...`);
  await worker.close();
  await pool.end();
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));