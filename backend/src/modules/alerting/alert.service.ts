// src/modules/alerting/alert.service.ts
import { pool } from '../../db/pool.js';
import { BrevoService } from './brevo.service.js';

export type AlertType = 'OPEN' | 'RESOLVE';

interface AlertNotificationParams {
  incidentId: string;
  alertType: AlertType;
  targetUrl: string;
  userEmail: string;
  method?: string;
  statusCode?: number | null;
  engineType?: 'HTTP Poller' | 'Heartbeat Snitch';
  dashboardUrl?: string;
}

export class AlertService {
  /**
   * Dispatches an incident notification email using the full-bleed card layout
   */
  static async sendIncidentNotification({
    incidentId,
    alertType,
    targetUrl,
    userEmail,
    method = 'GET',
    statusCode = null,
    engineType = 'HTTP Poller',
    dashboardUrl = 'http://localhost:5173/incidents',
  }: AlertNotificationParams): Promise<void> {
    // 1. Atomic Deduplication: Ensure at-most-once delivery per state change in PostgreSQL
    const dedupeResult = await pool.query<{ id: string }>(
      `INSERT INTO alerts_sent (incident_id, alert_type)
       VALUES ($1, $2)
       ON CONFLICT (incident_id, alert_type) DO NOTHING
       RETURNING id`,
      [incidentId, alertType]
    );

    if (dedupeResult.rowCount === 0) {
      console.log(`🔕 [AlertService] Deduplicated: ${alertType} alert for incident ${incidentId} already dispatched.`);
      return;
    }

    // 2. Demo Mode Check: Skip external email dispatch for Demo accounts while keeping DB record for Alerts page
    const userResult = await pool.query<{ is_demo: boolean }>(
      `SELECT is_demo FROM users WHERE email = $1`,
      [userEmail]
    );
    const isDemo = userResult.rows[0]?.is_demo ?? (userEmail === 'demo@sentinel.dev');

    if (isDemo) {
      console.log(`📧 [AlertService] [DEMO MODE] Alert recorded in database for ${userEmail} (${alertType} notification). External email dispatch bypassed.`);
      return;
    }

    const isDown = alertType === 'OPEN';
    const nowUtc = new Date().toUTCString().replace('GMT', 'UTC');

    // 2. Strict Dynamic Theme Properties
    const theme = isDown
      ? {
          canvasBg: '#fff1f2', // Soft rose canvas
          cardBg: '#9f1239', // Deep Crimson/Rose base
          pillBg: '#ffe4e6',
          pillColor: '#9f1239',
          pillLabel: '● CRITICAL INCIDENT',
          // editorialQuote: '“',
          headline: 'Target unreachable.<br/>Hysteresis breach detected.',
          streakPercent: '100%',
          streakBarText: 'Threshold Breached (3/3 Fails)',
          statusLabel: statusCode ? `HTTP ${statusCode} Error` : 'Unreachable / Connection Refused',
          statusColor: '#e11d48',
          streakChip: '3x Consecutive Fails',
          btnBg: '#0f172a',
          btnHover: '#1e293b',
        }
      : {
          canvasBg: '#f0fdf4', // Soft emerald canvas
          cardBg: '#065f46', // Deep Forest Emerald base
          pillBg: '#dcfce7',
          pillColor: '#065f46',
          pillLabel: '● ALL SYSTEMS NOMINAL',
          editorialQuote: '“',
          headline: 'Target operational.<br/>Recovery criteria satisfied.',
          streakPercent: '100%',
          streakBarText: 'Threshold Verified (2/2 Passes)',
          statusLabel: statusCode ? `HTTP ${statusCode} OK` : 'Healthy Verification (200 OK)',
          statusColor: '#059669',
          streakChip: '2x Consecutive Passes',
          btnBg: '#0f172a',
          btnHover: '#1e293b',
        };

    const subject = isDown
      ? `🚨 [CRITICAL] Outage Alert: ${targetUrl} is unreachable`
      : `✅ [RESOLVED] Service Recovered: ${targetUrl} is back online`;

    // 3. Email-safe, cross-client HTML template
    const htmlContent = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${theme.canvasBg}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #0f172a;">
  
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: ${theme.canvasBg}; padding: 40px 16px;">
    <tr>
      <td align="center">
        
        <!-- Full-Bleed Colored Card -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 580px; background-color: ${theme.cardBg}; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.25);">
          <tr>
            <td style="padding: 36px 36px 32px 36px;">
              
              <!-- 1. System Badge Strip (No Image Logo) -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 28px;">
                <tr>
                  <td align="left" style="vertical-align: middle;">
                    <span style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; color: rgba(255, 255, 255, 0.8); text-transform: uppercase;">
                      SENTINEL // HYSTERESIS ENGINE
                    </span>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span style="display: inline-block; padding: 4px 12px; background-color: ${theme.pillBg}; color: ${theme.pillColor}; font-size: 10px; font-weight: 800; border-radius: 9999px; letter-spacing: 0.05em; text-transform: uppercase;">
                      ${theme.pillLabel}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- 2. Editorial Quote & Hero Display -->
              <h1 style="margin: 0 0 20px 0; font-size: 26px; font-weight: 800; line-height: 1.25; color: #ffffff; letter-spacing: -0.02em;">
                ${theme.headline}
              </h1>

              <!-- 3. Rule Threshold Indicator (Inspired by 91% progress indicator) -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 30px;">
                <tr>
                  <td style="vertical-align: middle;">
                    <div style="height: 2px; width: 100%; background-color: rgba(255, 255, 255, 0.2); position: relative;">
                      <div style="height: 2px; width: 100%; background-color: #ffffff;"></div>
                    </div>
                  </td>
                  <td align="right" style="padding-left: 12px; white-space: nowrap; vertical-align: middle;">
                    <span style="font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; font-weight: 700; color: #ffffff; letter-spacing: 0.05em;">
                      ${theme.streakBarText}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- 4. Telemetry Details Bento Inlay -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 14px; overflow: hidden; margin-bottom: 16px;">
                <tr>
                  <td style="padding: 14px 18px; border-bottom: 1px solid #f1f5f9; font-size: 13px;">
                    <span style="color: #64748b; font-weight: 600; display: inline-block; width: 90px;">Target URL</span>
                    <a href="${targetUrl}" target="_blank" style="color: #2563eb; text-decoration: none; font-weight: 700; font-family: ui-monospace, Menlo, monospace; word-break: break-all;">
                      ${targetUrl}
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 14px 18px; border-bottom: 1px solid #f1f5f9; font-size: 13px;">
                    <span style="color: #64748b; font-weight: 600; display: inline-block; width: 90px;">Status</span>
                    <span style="color: ${theme.statusColor}; font-weight: 800;">
                      ${theme.statusLabel}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 14px 18px; font-size: 13px;">
                    <span style="color: #64748b; font-weight: 600; display: inline-block; width: 90px;">Incident ID</span>
                    <span style="color: #334155; font-family: ui-monospace, Menlo, monospace; font-size: 12px;">
                      ${incidentId}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- 5. Mini Stat Chips Row (Fact-Based Metrics Only) -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 16px;">
                <tr>
                  <td width="32%" align="center" style="background-color: rgba(255, 255, 255, 0.12); border-radius: 10px; padding: 10px 4px;">
                    <div style="font-size: 9px; color: rgba(255, 255, 255, 0.7); font-weight: 700; text-transform: uppercase; margin-bottom: 2px;">Method</div>
                    <div style="font-size: 12px; color: #ffffff; font-weight: 800; font-family: ui-monospace, monospace;">${method}</div>
                  </td>
                  <td width="2%">&nbsp;</td>
                  <td width="32%" align="center" style="background-color: rgba(255, 255, 255, 0.12); border-radius: 10px; padding: 10px 4px;">
                    <div style="font-size: 9px; color: rgba(255, 255, 255, 0.7); font-weight: 700; text-transform: uppercase; margin-bottom: 2px;">Streak</div>
                    <div style="font-size: 12px; color: #ffffff; font-weight: 800;">${theme.streakChip}</div>
                  </td>
                  <td width="2%">&nbsp;</td>
                  <td width="32%" align="center" style="background-color: rgba(255, 255, 255, 0.12); border-radius: 10px; padding: 10px 4px;">
                    <div style="font-size: 9px; color: rgba(255, 255, 255, 0.7); font-weight: 700; text-transform: uppercase; margin-bottom: 2px;">Monitor Engine</div>
                    <div style="font-size: 12px; color: #ffffff; font-weight: 800;">${engineType}</div>
                  </td>
                </tr>
              </table>

              <!-- 6. Dedicated Sentinel Resolution & Deduplication Guarantee Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: rgba(0, 0, 0, 0.22); border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.15); margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <div style="font-size: 11px; font-weight: 800; color: #ffffff; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 8px;">
                      🛡️ Sentinel Resolution & Deduplication Guarantee
                    </div>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="font-size: 12px; line-height: 1.5; color: rgba(255, 255, 255, 0.85); padding-bottom: 6px;">
                          • <strong>Anti-Spam Suppression:</strong> Notifications are suppressed while an incident is active. You will not receive repeated emails for recurring failures.
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size: 12px; line-height: 1.5; color: rgba(255, 255, 255, 0.85);">
                          • <strong>Hysteresis Gate:</strong> Requires 2 consecutive healthy checks before marking resolved and confirming service stabilization.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- 7. Floating Action Dock (Inspired by the Reference Pill Dock) -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 14px; padding: 10px 14px;">
                <tr>
                  <td align="left" style="vertical-align: middle;">
                    <span style="display: inline-block; background-color: #f1f5f9; padding: 6px 12px; border-radius: 8px; font-family: ui-monospace, Menlo, monospace; font-size: 12px; font-weight: 700; color: #334155;">
                      🕒 ${new Date().toISOString().substring(11, 19)} UTC
                    </span>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <a href="${dashboardUrl}" target="_blank" style="display: inline-block; background-color: ${theme.btnBg}; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 9px 20px; border-radius: 9999px;">
                      Inspect Timeline →
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>

        <!-- Technical Minimalist Footer -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 580px; margin-top: 18px;">
          <tr>
            <td align="center" style="font-size: 11px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; color: #94a3b8; line-height: 1.6;">
              Automated telemetry notification • Sentinel Hysteresis Core<br/>
              Log Ref: ${incidentId}
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`;

    // 4. Dispatch via Brevo HTTP API
    const success = await BrevoService.sendEmail({
      toEmail: userEmail,
      subject,
      htmlContent,
    });

    if (success) {
      console.log(`📧 [AlertService] Dispatched ${alertType} notification to ${userEmail}`);
    } else {
      console.error(`⚠️ [AlertService] Failed to send ${alertType} notification via Brevo`);
    }
  }
}