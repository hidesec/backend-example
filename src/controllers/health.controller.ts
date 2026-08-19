import { Get, RestController } from "@decorators/route.decorator";
import { Pool } from "pg";
import { inject } from "tsyringe";
import { Request, Response } from "express";

@RestController()
export class HealthController {
    constructor(@inject("DatabasePool") private readonly pool: Pool) {}

    @Get("/health")
    check = async (_reg: Request, res: Response) => {
        try {
            await this.pool.query("SELECT 1");
            res.status(200).json({ status: "ok", database: "connect", timestamp: new Date().toISOString });
        } catch (err) {
            res.status(503).json({ status: "error", database: "disconnected", timestamp: new Date().toISOString });
        }
    }
}