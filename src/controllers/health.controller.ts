import { Pool } from "pg";
import { inject } from "tsyringe";
import { RestController, Get } from "@decorators/route.decorator";
import { ServiceUnavailableException } from "@exceptions/http-exceptions";

@RestController()
export class HealthController {
    constructor(@inject("DatabasePool") private readonly pool: Pool) {}

    @Get("/health")
    check = async () => {
        try {
            await this.pool.query("SELECT 1");
        } catch {
            throw new ServiceUnavailableException("Database disconnected");
        }

        return { status: "ok", database: "connect", timestamp: new Date().toISOString() };
    };
}