import { Pool } from "pg";
import { RestController, Get } from "@decorators/route.decorator";
import { ServiceUnavailableException } from "@exceptions/http-exceptions";
import { AutoWired } from "@decorators/autowired.decorator";

@RestController()
export class HealthController {
    @AutoWired("DatabasePool")
    declare private pool: Pool;

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