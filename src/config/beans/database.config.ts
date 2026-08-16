import { Pool } from "pg";
import { Bean, Configuration } from "@decorators/bean.decorator";
import { env } from "@config/env";
import { logger } from "@config/logger";

@Configuration()
export class DatabaseConfig {
    @Bean("DatabasePool")
    pool(): Pool {
        const pool = new Pool({
            host: env.DB_HOST,
            port: env.DB_PORT,
            database: env.DB_NAME,
            user: env.DB_USER,
            password: env.DB_PASSWORD,
            max: 10,
            idleTimeoutMillis: 30_000,
            connectionTimeoutMillis: 5_000,
        });

        pool.on("error", (err) => {
            logger.error({ err }, "Unexpected error on idle PostgreSQL client");
        });

        pool.on("connect", () => {
            logger.debug("New PostgreSQL client connected to pool");
        });

        return pool;
    }
}