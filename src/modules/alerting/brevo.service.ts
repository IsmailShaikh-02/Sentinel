// src/modules/alerting/brevo.service.ts
import { env } from '../../env.js';

interface SendEmailParams {
  toEmail: string;
  subject: string;
  htmlContent: string;
}

export class BrevoService {
  private static readonly API_URL = 'https://api.brevo.com/v3/smtp/email';

  static async sendEmail({ toEmail, subject, htmlContent }: SendEmailParams): Promise<boolean> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'api-key': env.BREVO_API_KEY,
        },
        body: JSON.stringify({
          sender: { email: env.BREVO_SENDER_EMAIL, name: env.BREVO_SENDER_NAME },
          to: [{ email: toEmail }],
          subject,
          htmlContent,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Brevo] Failed to send email (${response.status}):`, errorText);
        return false;
      }

      return true;
    } catch (err) {
      console.error('[Brevo] Network error while dispatching email:', err);
      return false;
    } finally {
      clearTimeout(timeout);
    }
  }
}