import fs from "fs";
import path from "path";
import { Pool } from "pg";

interface MigrationPair {
  name: string;
  upPath: string;
  downPath: string;
}

const MIGRATIONS_TABLE = "schema_migrations";

export class MigrationRunner {
  constructor(
    private readonly pool: Pool,
    private readonly migrationsDir: string
  ) {}

  async run(): Promise<void> {
    await this.ensureMigrationsTable();
    const all = this.getMigrationPairs();
    const applied = await this.getAppliedMigrations();
    const pending = all.filter((m) => !applied.includes(m.name));

    if (pending.length === 0) {
      console.log("No pending migrations. Database is up to date.");
      return;
    }

    console.log(`Found ${pending.length} pending migration(s):`);
    for (const m of pending) {
      await this.applyUp(m);
    }
    console.log("All migrations applied successfully.");
  }

  async rollback(steps = 1): Promise<void> {
    await this.ensureMigrationsTable();
    const applied = await this.getAppliedMigrations();

    if (applied.length === 0) {
      console.log("Nothing to rollback.");
      return;
    }

    const all = this.getMigrationPairs();
    const toRollback = applied.slice(-steps).reverse();

    for (const name of toRollback) {
      const pair = all.find((m) => m.name === name);
      if (!pair) {
        console.error(`Migration files for "${name}" not found on disk, skipping.`);
        continue;
      }
      await this.applyDown(pair);
    }
    console.log(`Rolled back ${toRollback.length} migration(s).`);
  }

  private async ensureMigrationsTable(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
  }

  private getMigrationPairs(): MigrationPair[] {
    if (!fs.existsSync(this.migrationsDir)) return [];

    const upFiles = fs
      .readdirSync(this.migrationsDir)
      .filter((f) => f.endsWith(".up.sql"))
      .sort();

    return upFiles.map((upFile) => {
      const name = upFile.replace(/\.up\.sql$/, "");
      return {
        name,
        upPath: path.join(this.migrationsDir, upFile),
        downPath: path.join(this.migrationsDir, `${name}.down.sql`),
      };
    });
  }

  private async getAppliedMigrations(): Promise<string[]> {
    const result = await this.pool.query<{ name: string }>(
      `SELECT name FROM ${MIGRATIONS_TABLE} ORDER BY id ASC`
    );
    return result.rows.map((r) => r.name);
  }

  private async applyUp(migration: MigrationPair): Promise<void> {
    const sql = fs.readFileSync(migration.upPath, "utf-8");
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query(`INSERT INTO ${MIGRATIONS_TABLE} (name) VALUES ($1)`, [migration.name]);
      await client.query("COMMIT");
      console.log(`Applied: ${migration.name}`);
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(`Failed: ${migration.name}`);
      throw err;
    } finally {
      client.release();
    }
  }

  private async applyDown(migration: MigrationPair): Promise<void> {
    if (!fs.existsSync(migration.downPath)) {
      console.error(`No .down.sql file found for: ${migration.name}`);
      return;
    }

    const sql = fs.readFileSync(migration.downPath, "utf-8");
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query(`DELETE FROM ${MIGRATIONS_TABLE} WHERE name = $1`, [migration.name]);
      await client.query("COMMIT");
      console.log(`Reverted: ${migration.name}`);
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(`Failed to revert: ${migration.name}`);
      throw err;
    } finally {
      client.release();
    }
  }

  async status(): Promise<void> {
    await this.ensureMigrationsTable();
    const all = this.getMigrationPairs();
    const applied = await this.getAppliedMigrations();

    console.log("\nMigration Status:");
    console.log("─".repeat(50));
    all.forEach((m) => {
      console.log(`  ${applied.includes(m.name) ? "V" : "-"} ${m.name}`);
    });
    console.log("─".repeat(50));
  }
}