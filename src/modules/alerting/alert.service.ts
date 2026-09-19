// src/modules/alerting/alert.service.ts
import { pool } from '../../db/pool.js';
import { BrevoService } from './brevo.service.js';

export type AlertType = 'OPEN' | 'RESOLVE';

export class AlertService {
  /**
   * Dispatches an incident notification email with atomic database deduplication
   */
  static async sendIncidentNotification(
    incidentId: string,
    alertType: AlertType,
    targetUrl: string,
    userEmail: string
  ): Promise<void> {
    // 1. Atomic Deduplication: Try to record the alert intent in PostgreSQL
    const dedupeResult = await pool.query<{ id: string }>(
      `INSERT INTO alerts_sent (incident_id, alert_type)
       VALUES ($1, $2)
       ON CONFLICT (incident_id, alert_type) DO NOTHING
       RETURNING id`,
      [incidentId, alertType]
    );

    // If no row was inserted, an alert for this (incident, type) pair was already dispatched
    if (dedupeResult.rowCount === 0) {
      console.log(`🔕 [AlertService] Deduplicated: ${alertType} alert for incident ${incidentId} already sent.`);
      return;
    }

    // 2. Build the email copy based on the transition state
    const isDown = alertType === 'OPEN';
    const subject = isDown
      ? `🚨 [DOWN] Alert: Target ${targetUrl} is unreachable`
      : `✅ [RECOVERED] Resolved: Target ${targetUrl} is back online`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.5; color: #1e293b;">
        <h2 style="color: ${isDown ? '#dc2626' : '#16a34a'};">
          ${isDown ? 'Service Outage Detected' : 'Service Outage Resolved'}
        </h2>
        <p>The health check monitor has registered an incident state change:</p>
        <table style="border-collapse: collapse; margin-top: 15px;">
          <tr>
            <td style="padding: 6px 12px; font-weight: bold;">Target URL:</td>
            <td style="padding: 6px 12px;">${targetUrl}</td>
          </tr>
          <tr>
            <td style="padding: 6px 12px; font-weight: bold;">Status:</td>
            <td style="padding: 6px 12px; color: ${isDown ? '#dc2626' : '#16a34a'}; font-weight: bold;">
              ${isDown ? 'CRITICAL FAILURE' : 'HEALTHY / RECOVERED'}
            </td>
          </tr>
          <tr>
            <td style="padding: 6px 12px; font-weight: bold;">Incident ID:</td>
            <td style="padding: 6px 12px; font-family: monospace;">${incidentId}</td>
          </tr>
        </table>
        <p style="margin-top: 20px; font-size: 12px; color: #64748b;">
          Automated alert sent by Sentinel Health Monitor.
        </p>
      </div>
    `;

    // 3. Dispatch via Brevo
    const success = await BrevoService.sendEmail({
      toEmail: userEmail,
      subject,
      htmlContent,
    });

    if (success) {
      console.log(`📧 [AlertService] Dispatched ${alertType} alert email to ${userEmail} for incident ${incidentId}`);
    } else {
      console.error(`⚠️ [AlertService] Failed to send ${alertType} alert email via Brevo API`);
    }
  }
}