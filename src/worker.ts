import { Worker, type Job } from "bullmq";
import { pool } from "./db/pool.js";
import { runWorkerCheck } from "./services/checkService.js";
import { CHECK_QUEUE_NAME, syncRepeatableJobs } from "./queue/checkQueue.js";
import { redisConnection } from "./queue/redisConnection.js";
import type { CheckJobData } from "./queue/types.js";
import { incidentAnalyzer } from "./services/incidentService.js";
import { env } from "./env.js";

const worker = new Worker<CheckJobData>(
  CHECK_QUEUE_NAME,
  async (job: Job<CheckJobData>) => {
    console.log(`[worker] checking ${job.data.serviceId} (trigger: ${job.data.trigger ?? "schedule"})`);
    const outcome = await runWorkerCheck(job.data.serviceId);
    console.log(`[worker] ${job.data.serviceId}: ok=${outcome.ok} status=${outcome.statusCode} time=${outcome.responseTimeMs}ms`);

    const incidentDecision = await incidentAnalyzer.analyzeForIncidents(job.data.serviceId);
    if (incidentDecision.action !== "none") {
      console.log(`[worker] INCIDENT: ${incidentDecision.action} - ${incidentDecision.reason}`);
    }

    return outcome;
  },
  { connection: redisConnection, concurrency: 10 },
);

worker.on("failed", (job, err) => {
  console.error(`[worker] job failed: ${job?.name ?? "?"} — ${err.message}`);
});

worker.on("error", (err) => {
  console.error("[worker] worker error:", err.message);
});

async function main(): Promise<void> {
  await syncRepeatableJobs();
  console.log(`[worker] running on queue "${CHECK_QUEUE_NAME}" (${env.NODE_ENV})`);
}

void main();

async function shutdown(signal: string): Promise<void> {
  console.log(`[worker] ${signal} received, closing worker...`);
  await worker.close();
  await pool.end();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));