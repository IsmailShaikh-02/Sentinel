// src/modules/alerting/alerts.controller.ts
import { Request, Response, NextFunction } from 'express';
import { pool } from '../../db/pool.js';

export class AlertsController {
  static async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? Math.min(parseInt(req.query.limit as string, 10), 100) : 20;
      const offset = (page - 1) * limit;

      // Count total alerts sent for services owned by this user
      const countResult = await pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count
         FROM alerts_sent a
         JOIN incidents i ON a.incident_id = i.id
         JOIN services s ON i.service_id = s.id
         WHERE s.user_id = $1`,
        [userId]
      );

      const total = parseInt(countResult.rows[0]?.count || '0', 10);
      const totalPages = Math.ceil(total / limit) || 1;

      // Fetch alert logs with recipient email from user profile
      const alertsResult = await pool.query(
        `SELECT 
           a.id,
           a.incident_id,
           u.email AS recipient,
           a.alert_type,
           a.sent_at,
           'sent' AS status
         FROM alerts_sent a
         JOIN incidents i ON a.incident_id = i.id
         JOIN services s ON i.service_id = s.id
         JOIN users u ON s.user_id = u.id
         WHERE s.user_id = $1
         ORDER BY a.sent_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      res.status(200).json({
        alerts: alertsResult.rows,
        total,
        page,
        totalPages,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getChannels(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      
      const userResult = await pool.query<{ id: string; email: string; created_at: string }>(
        `SELECT id, email, created_at FROM users WHERE id = $1`,
        [userId]
      );

      if (userResult.rows.length === 0) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const user = userResult.rows[0];

      // Format as single registered email channel
      const channel = {
        id: `user-email-${user.id}`,
        type: 'email',
        config: { email: user.email },
        enabled: true,
        created_at: user.created_at,
      };

      res.status(200).json([channel]);
    } catch (error) {
      next(error);
    }
  }
}
