import { Request, Response, NextFunction } from 'express';
import { ServiceManager } from './service.service.js';

export class ServiceController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const service = await ServiceManager.create(req.userId!, req.body);
      res.status(201).json(service);
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const services = await ServiceManager.listAll(req.userId!);
      res.status(200).json(services);
    } catch (error) {
      next(error);
    }
  }

  // Type the Params dictionary as { id: string }
  static async getById(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
    try {
      const service = await ServiceManager.getById(req.userId!, req.params.id);
      res.status(200).json(service);
    } catch (error) {
      next(error);
    }
  }

  // Type the Params dictionary as { id: string }
  static async update(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await ServiceManager.update(req.userId!, req.params.id, req.body);
      res.status(200).json(updated);
    } catch (error) {
      next(error);
    }
  }

  // Type the Params dictionary as { id: string }
  static async delete(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
    try {
      await ServiceManager.delete(req.userId!, req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  // check controller
  static async check(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void>{
    try{
      const checked = await ServiceManager.runManualCheck(req.userId!, req.params.id);
      res.status(200).json(checked);
    }catch(error){
      next(error);
    }
  }
}