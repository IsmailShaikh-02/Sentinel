import { Request, Response, NextFunction } from "express";
import { HeartbeatService } from "./heartbeat.service.js";

export class HeartbeatController{
    static async ping(req: Request<{key:string}>, res: Response, next: NextFunction): Promise<void>{
        try {
            const hb_key = req.params.key;
            const ack = await HeartbeatService.ping(hb_key);
            res.status(200).json({
                "status":"ok",
                "service":ack.name,
                "receivedAt":ack.receivedAt
            });
        } catch (error) {
            next(error);
        }        
    }
}