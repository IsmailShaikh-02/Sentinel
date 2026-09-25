import { Request, Response, NextFunction } from 'express';
import { StatusPageService } from "./status.service.js"

export class StatusPageController{
    static async getStatus(
        req: Request<{userId: string}>, 
        res: Response, 
        next: NextFunction
    ): Promise<void>{
        try{
            const stats = await StatusPageService.getOverview(req.params.userId);
            res.status(200).json(stats)
        } catch(err){
            next(err);
        }
    }
}