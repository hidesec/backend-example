import { logger } from "@config/logger";
import { Around } from "@decorators/aspect.decorator";

export function Auditable(action: string) {
    return Around(async (joinPoint, proceed) => {
        const result = await proceed();

        logger.info(
            { audit: true, action, class: joinPoint.className, method: joinPoint.methodName },
            `AUDIT: ${action}`
        );

        return result;
    });
}