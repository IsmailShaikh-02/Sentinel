import { Request, Response, NextFunction } from 'express';
import { IncidentsService } from './incidents.service.js';

export class IncidentsController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = req.query.status as string | undefined;
      const severity = req.query.severity as string | undefined;
      const serviceId = (req.query.service_id || req.query.serviceId) as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

      const result = await IncidentsService.listIncidents(req.userId!, {
        status,
        severity,
        serviceId,
        page,
        limit,
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
    try {
      const incident = await IncidentsService.getIncidentById(req.userId!, req.params.id);
      if (!incident) {
        res.status(404).json({ error: 'Incident not found' });
        return;
      }
      res.status(200).json(incident);
    } catch (error) {
      next(error);
    }
  }

  static async listForService(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await IncidentsService.listIncidents(req.userId!, {
        serviceId: req.params.id,
        limit: 100,
      });
      res.status(200).json(result.incidents);
    } catch (error) {
      next(error);
    }
  }
}
