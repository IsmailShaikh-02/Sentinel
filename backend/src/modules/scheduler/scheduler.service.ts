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

    // 1. Clear existing repeatable schedulers
    const currentSchedulers = await healthCheckQueue.getJobSchedulers();
    for (const scheduler of currentSchedulers) {
      if (scheduler.id) {
        await healthCheckQueue.removeJobScheduler(scheduler.id);
      }
    }

    // 2. Fetch and register only active HTTP services for outbound polling
    const result = await pool.query<{ id: string; check_interval_sec: number }>(
      `SELECT id, check_interval_sec 
       FROM services 
       WHERE enabled = true AND type = 'http'`
    );

    for (const service of result.rows) {
      await this.scheduleService(service.id, service.check_interval_sec);
    }

    // 3. Reconcile passive heartbeat sweeper
    await this.reconcileHeartbeatSweeper();

    console.log('✅ Scheduler synchronization complete');
  }
  
  // Add a method to schedule the dead man's switch sweeper
  /**
   * BullMQ v5: Upserts a recurring watchdog job to sweep for overdue heartbeats
   */
  static async scheduleHeartbeatSweeper(): Promise<void> {
    await healthCheckQueue.upsertJobScheduler(
      'system-heartbeat-sweeper',
      {
        every: 30000, // Runs every 30 seconds
      },
      {
        name: 'heartbeat-sweeper',
        data: { serviceId: 'system-heartbeat-sweeper' },
      }
    );
    console.log('⏱️ Scheduled Heartbeat Watchdog sweeper (every 30s)');
  }

  /**
   * Checks if any enabled heartbeat services exist.
   * If yes, ensures the sweeper scheduler is registered in BullMQ.
   * If no, tears down the sweeper scheduler so Redis does not execute empty loops.
   */
  static async reconcileHeartbeatSweeper(): Promise<void> {
    const result = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count 
       FROM services 
       WHERE enabled = true AND type = 'heartbeat'`
    );

    const count = parseInt(result.rows[0]?.count ?? '0', 10);

    if (count > 0) {
      // Upsert the single watchdog job (runs every 30s)
      await healthCheckQueue.upsertJobScheduler(
        'system-heartbeat-sweeper',
        {
          every: 30000,
        },
        {
          name: 'heartbeat-sweeper',
          data: { serviceId: 'system-heartbeat-sweeper' },
        }
      );
      console.log(`⏱️ [Scheduler] Heartbeat watchdog active (${count} enabled heartbeat services)`);
    } else {
      // Clean up the scheduler if no heartbeat services are active
      try {
        await healthCheckQueue.removeJobScheduler('system-heartbeat-sweeper');
        console.log('🛑 [Scheduler] Heartbeat watchdog dormant (0 enabled heartbeat services)');
      } catch (_err) {
        // Ignored if scheduler was not previously registered
      }
    }
  }
}