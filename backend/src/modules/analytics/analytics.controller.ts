import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from './analytics.service.js';
import type { UptimeWindow } from './analytics.schema.js';

export class AnalyticsController {
  static async getUptime(
    req: Request<{ id: string }, unknown, unknown, { window?: UptimeWindow }>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const window = req.query.window ?? '24h';
      const stats = await AnalyticsService.getUptime(req.userId!, req.params.id, window);
      res.status(200).json(stats);
    } catch (error) {
      next(error);
    }
  }

  static async getLatency(
    req: Request<{ id: string }, unknown, unknown, { window?: UptimeWindow }>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const window = req.query.window ?? '24h';
      const stats = await AnalyticsService.getLatency(req.userId!, req.params.id, window);
      res.status(200).json(stats);
    } catch (error) {
      next(error);
    }
  }
}