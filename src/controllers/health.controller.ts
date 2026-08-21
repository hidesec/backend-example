import { RestController, Get } from "@decorators/route.decorator";
import { ServiceUnavailableException } from "@exceptions/http-exceptions";
import { AutoWired } from "@decorators/autowired.decorator";
import { DatabaseDriver } from "@database/core/types";

@RestController()
export class HealthController {
    @AutoWired("DatabaseDriver")
    declare private driver: DatabaseDriver;

    @Get("/health")
    check = async () => {
        try {
            await this.driver.query("SELECT 1");
        } catch {
            throw new ServiceUnavailableException("Database disconnected");
        }

        return { status: "ok", database: "connect", client: this.driver.clientName, timestamp: new Date().toISOString() };
    };
}
