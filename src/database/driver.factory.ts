import { env } from "@config/env";
import { logger } from "@config/logger";
import { DatabaseDriver } from "./core/types";
import { PostgresDriver } from "./drivers/postgres.driver";
import { SqliteDriver } from "./drivers/sqlite.driver";

export async function createDatabaseDriver(): Promise<DatabaseDriver> {
    switch (env.DB_CLIENT) {
        case "postgres": {
            const driver = new PostgresDriver({
                host: env.DB_HOST,
                port: env.DB_PORT,
                database: env.DB_NAME,
                user: env.DB_USER,
                password: env.DB_PASSWORD,
            });
            await driver.connect();
            logger.info(`Connected to PostgreSQL at ${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`);
            return driver;
        }

        case "sqlite": {
            const driver = new SqliteDriver(env.DB_FILE);
            await driver.connect();
            logger.info(`Connected to SQLite database at ${env.DB_FILE}`);
            return driver;
        }

        case "mysql": {
            const { MysqlDriver } = await import("./drivers/mysql.driver");
            const driver = await MysqlDriver.create({
                host: env.DB_HOST,
                port: env.DB_PORT,
                database: env.DB_NAME,
                user: env.DB_USER,
                password: env.DB_PASSWORD,
            });
            await driver.connect();
            logger.info(`Connected to MySQL at ${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`);
            return driver;
        }

        case "mssql": {
            const { MssqlDriver } = await import("./drivers/mssql.driver");
            const driver = await MssqlDriver.create({
                server: env.DB_HOST,
                port: env.DB_PORT,
                database: env.DB_NAME,
                user: env.DB_USER,
                password: env.DB_PASSWORD,
            });
            await driver.connect();
            logger.info(`Connected to MSSQL at ${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`);
            return driver;
        }

        case "oracle": {
            const { OracleDriver } = await import("./drivers/oracle.driver");
            const driver = await OracleDriver.create({
                user: env.DB_USER,
                password: env.DB_PASSWORD,
                connectString: `${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`,
            });
            await driver.connect();
            logger.info(`Connected to Oracle at ${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`);
            return driver;
        }
    }
}
