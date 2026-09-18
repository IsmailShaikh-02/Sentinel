// src/worker.ts
import { Worker, Job } from 'bullmq';
import { pool } from './db/pool.js';
import { redisConnection } from './lib/redis.js';
import { HEALTH_CHECK_QUEUE_NAME, HealthCheckJobData } from './modules/scheduler/queue.js';
import { probeUrl } from './modules/services/checker.js';
import { IncidentEngine } from './modules/engine/engine.service.js';

interface ServiceTarget {
  id: string;
  url: string;
  method: string;
  expected_status: number;
  enabled: boolean;
}

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

async function processHealthCheckJob(job: Job<HealthCheckJobData>): Promise<void> {
  const { serviceId } = job.data;

  const service = await getTargetService(serviceId);
  if (!service) {
    console.log(`[Worker] Service ${serviceId} not found or disabled; skipping check.`);
    return;
  }

  // 1. Probe the target
  const probe = await probeUrl(service.url, service.method, service.expected_status, 5000);

  // 2. Insert append-only fact into Postgres
  await pool.query(
    `INSERT INTO checks (service_id, status_code, response_time_ms, ok)
     VALUES ($1, $2, $3, $4)`,
    [service.id, probe.statusCode, probe.responseTimeMs, probe.ok]
  );

  // 3. Post-process probe with Incident Hysteresis Engine
  try {
    await IncidentEngine.processHealthProbe(service.id);
  } catch (err) {
    console.error(`❌ Incident Engine failed processing check for service ${service.id}:`, err);
  }

  const statusLabel = probe.statusCode !== null ? `${probe.statusCode}` : 'TIMEOUT/ERROR';
  console.log(
    `[Worker] Checked ${service.url} -> ${statusLabel} (${probe.responseTimeMs}ms) [ok: ${probe.ok}]`
  );
}

export const worker = new Worker<HealthCheckJobData>(
  HEALTH_CHECK_QUEUE_NAME,
  processHealthCheckJob,
  {
    connection: redisConnection,
    concurrency: 5,
  }
);

worker.on('ready', () => {
  console.log(`🚀 Sentinel Background Worker active on queue "${HEALTH_CHECK_QUEUE_NAME}"`);
});

worker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed with error:`, err);
});

const shutdown = async (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Closing worker and database connections...`);
  await worker.close();
  await pool.end();
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));