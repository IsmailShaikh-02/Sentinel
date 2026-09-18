// src/modules/engine/engine.service.ts
import {
  getActiveIncident,
  determineFailureStreak,
  determineRecoveryStreak,
  IncidentRepo,
} from '../../db/incidents.repo.js';

export class IncidentEngine {
  /**
   * Evaluates chronological health probe history to open or resolve incidents via hysteresis
   */
  static async processHealthProbe(serviceId: string): Promise<void> {
    // 1. Check if an incident is currently open for this service
    const activeIncident = await getActiveIncident(serviceId);

    if (activeIncident) {
      // Branch A: Incident is active. Look for recovery (2 consecutive successes)
      const isRecovered = await determineRecoveryStreak(serviceId, 2);

      if (isRecovered) {
        await IncidentRepo.resolve(activeIncident.id);
      }
    } else {
      // Branch B: No active incident. Look for outage (3 consecutive failures)
      const failureStartTime = await determineFailureStreak(serviceId, 3);

      if (failureStartTime) {
        const summary = 'Service failed 3 consecutive health probes.';
        await IncidentRepo.open(serviceId, summary, failureStartTime);
      }
    }
  }
}