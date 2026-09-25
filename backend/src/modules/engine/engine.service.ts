// src/modules/engine/engine.service.ts
import {
  getActiveIncident,
  determineFailureStreak,
  determineRecoveryStreak,
  IncidentRepo,
  getServiceTargetMetadata,
} from '../../db/incidents.repo.js';
import { AlertService } from '../alerting/alert.service.js';

export class IncidentEngine {
  static async processHealthProbe(serviceId: string): Promise<void> {
    // 1. Fetch current incident state
    const activeIncident = await getActiveIncident(serviceId);

    if (activeIncident) {
      // Branch A: Active incident exists. Check recovery (2 consecutive successes)
      const isRecovered = await determineRecoveryStreak(serviceId, 2);

      if (isRecovered) {
        await IncidentRepo.resolve(activeIncident.id);

        const userData = await getServiceTargetMetadata(serviceId);
        if (userData) {
          await AlertService.sendIncidentNotification({
  incidentId: activeIncident.id,
  alertType: 'RESOLVE',
  targetUrl: userData.url,
  userEmail: userData.userEmail,
  statusCode: 200,
  // latencyMs: 12,
  engineType: 'HTTP Poller',
});
        }
      }
    } else {
      // Branch B: No active incident. Check outage (3 consecutive failures)
      const failureStartTime = await determineFailureStreak(serviceId, 3);

      if (failureStartTime) {
        const summary = 'Service failed 3 consecutive health probes.';
        // Capture the newly created incident so we have its valid ID
        const newIncident = await IncidentRepo.open(serviceId, summary, failureStartTime);

        const userData = await getServiceTargetMetadata(serviceId);
        if (userData) {
          await AlertService.sendIncidentNotification({
  incidentId: newIncident.id,
  alertType: 'OPEN',
  targetUrl: userData.url,
  userEmail: userData.userEmail,
  statusCode: 500,
  // latencyMs: 18,
  engineType: 'HTTP Poller',
});
        }
      }
    }
  }
}