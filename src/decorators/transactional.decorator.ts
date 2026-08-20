import { Pool } from "pg";
import { container } from "tsyringe";
import { logger } from "@config/logger";
import { getActiveTransactionClient, runInTransactionContext } from "@database/transaction-context";

export function Transactional() {
    return function (
        _target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (this: any, ...args: any[]) {
            const existingClient = getActiveTransactionClient();

            if (existingClient) {
                return originalMethod.apply(this, args);
            }

            const pool = container.resolve<Pool>("DatabasePool");
            const client = await pool.connect();

            try {
                await client.query("BEGIN");

                const result = await runInTransactionContext(client, () => 
                    originalMethod.apply(this, args)
                );

                await client.query("COMMIT");
                return result;
            } catch (err) {
                await client.query("ROLLBACK");
                logger.warn({ method: propertyKey }, "Transactional rolled back");
                throw err;
            } finally {
                client.release();
            }
        };

        return descriptor;
    };
}