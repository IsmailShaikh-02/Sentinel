import { healthCheckQueue, HealthCheckJobData } from './queue.js';
import { pool } from '../../db/pool.js';

export class SchedulerService {
  /**
   * Upserts a repeatable check job scheduler for a service in BullMQ v5.
   * If a scheduler already exists with this ID, BullMQ updates its interval.
   */
  static async scheduleService(serviceId: string, intervalSec: number): Promise<void> {
    const schedulerId = `service-${serviceId}`;
    const jobData: HealthCheckJobData = { serviceId };

    await healthCheckQueue.upsertJobScheduler(
      schedulerId,
      {
        every: intervalSec * 1000,
      },
      {
        name: `check-${serviceId}`,
        data: jobData,
      }
    );

    console.log(`⏱️ Scheduled background check for service ${serviceId} every ${intervalSec}s`);
  }

  /**
   * Removes a job scheduler by its deterministic scheduler ID.
   */
  static async removeService(serviceId: string): Promise<void> {
    const schedulerId = `service-${serviceId}`;
    const removed = await healthCheckQueue.removeJobScheduler(schedulerId);

    if (removed) {
      console.log(`🛑 Removed background check for service ${serviceId}`);
    }
  }

  /**
   * Synchronizes all active services from PostgreSQL into BullMQ on startup.
   */
  static async syncAllServices(): Promise<void> {
    console.log('🔄 Syncing active services with Redis scheduler...');

    // 1. Remove all existing schedulers to clear stale jobs
    const currentSchedulers = await healthCheckQueue.getJobSchedulers();
    for (const scheduler of currentSchedulers) {
      // Guard against null/undefined scheduler IDs
      if (scheduler.id) {
        await healthCheckQueue.removeJobScheduler(scheduler.id);
      }
    }

    // 2. Fetch all enabled services from PostgreSQL
    const result = await pool.query<{ id: string; check_interval_sec: number }>(
      `SELECT id, check_interval_sec FROM services WHERE enabled = true`
    );

    for (const service of result.rows) {
      await this.scheduleService(service.id, service.check_interval_sec);
    }

    console.log(`✅ Synchronized ${result.rows.length} active service checks with Redis`);
  }
}