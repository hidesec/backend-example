import path from "path";
import { Pool } from "pg";
import { loadEnv } from "@config/load-env";
import { MigrationRunner } from "./migration-runner";

loadEnv();

async function main() {
    const command = process.argv[2] ?? "up";

    const pool = new Pool({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    });

    const migrationsDir = path.join(__dirname, "migrations");
    const runner = new MigrationRunner(pool, migrationsDir);

    try {
        switch(command) {
            case "up":
                await runner.run();
                break;
            case "down": {
                const steps = Number(process.argv[3]) || 1;
                await runner.rollback(steps);
                break;
            }
            case "status":
                await runner.status()
                break;
            default:
                console.error(`Unknown command: "${command}". Use "up", "down [steps]", or "status"`);
                process.exit(1);
        }
    } catch(err) {
        console.error("Migration failed:", err);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

main();