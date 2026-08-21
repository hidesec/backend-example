import { logger } from "@config/logger";
import { Bean } from "@decorators/bean.decorator";
import { cacheManager } from "@decorators/cache.decorator";
import { Scheduled } from "@schedule/scheduler";

@Bean()
export class CacheMaintenanceTask {
    @Scheduled("*/10 * * * *")
    async sweepExpiredCacheEntries(): Promise<void> {
        const removed = cacheManager.sweep();
        if (removed > 0) {
            logger.info({ removed }, "Expired cache entries swept");
        }
    }
}
