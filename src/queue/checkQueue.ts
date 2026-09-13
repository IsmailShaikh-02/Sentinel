import { Queue } from "bullmq";
import { pool } from "../db/pool.js";
import { redisConnection } from "./redisConnection.js";
import type { CheckJobData } from "./types.js";

export const CHECK_QUEUE_NAME = "checks";

export const checkQueue = new Queue<CheckJobData>(CHECK_QUEUE_NAME, {
  connection: redisConnection,
});

/**
 * Ensures every enabled service has a job scheduler firing every
 * check_interval_sec, and removes schedulers for disabled/deleted services.
 *
 * The new BullMQ API is upsert-based: re-running with the same scheduler id
 * and config overwrites in place, so this is idempotent — worker restarts
 * converge to the correct schedule instead of multiplying jobs.
 */
export async function syncRepeatableJobs(): Promise<void> {
  const { rows: services } = await pool.query<{ id: string; check_interval_sec: number }>(
    "SELECT id, check_interval_sec FROM services WHERE enabled = true",
  );

  const existing = await checkQueue.getJobSchedulers();
  const wantedIds = new Set(services.map((s) => s.id));

  // 1. Remove schedulers that no longer correspond to an enabled service
  // 1. Remove schedulers that no longer correspond to an enabled service
  for (const scheduler of existing) {
    const { id } = scheduler;
    if (typeof id !== "string") continue;      // defensive: skip malformed entries
    if (!wantedIds.has(id)) {
      await checkQueue.removeJobScheduler(id);
    }
  }
  // 2. Upsert one scheduler per enabled service
  //    (upsert also handles interval changes — no diffing needed)
  for (const service of services) {
    await checkQueue.upsertJobScheduler(
      `check-${service.id}`,                     // scheduler id, stable per service
      { every: service.check_interval_sec * 1000 },
      {
        name: service.id,
        data: { serviceId: service.id, trigger: "schedule" } satisfies CheckJobData,
      },
    );
  }
}

/** Enqueue an immediate one-off check (used later by the API or tests). */
export async function enqueueImmediateCheck(serviceId: string): Promise<string | undefined> {
  const job = await checkQueue.add(
    serviceId,
    { serviceId, trigger: "manual" } satisfies CheckJobData,
    { jobId: `manual-${serviceId}-${Date.now()}` },
  );
  return job.id;
}