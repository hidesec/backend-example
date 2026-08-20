import { ColumnMetadata, EntityMetadata, ForeignKeyMetadata, getEntityMetadata } from "@decorators/orm/column.decorator";
import { getQueryRunner } from "@database/transaction-context";
import { IBaseRepository } from "@database/base-repository.interface";

export abstract class BaseRepository<T extends object, ID = string> implements IBaseRepository<T, ID> {
    protected abstract readonly entityCtor: new (...args: any[]) => T;

    protected get meta(): EntityMetadata {
        const meta = getEntityMetadata(this.entityCtor);
        if (!meta) {
            throw new Error(
                `No @Entity metadata found for "${this.entityCtor.name}". Did you forget to add @Entity() to it?`
            );
        }
        return meta;
    }

    protected get qualifiedTable(): string {
        return `${this.meta.schemaName}.${this.meta.tableName}`;
    }

    protected get primaryColumn(): ColumnMetadata {
        const pk = this.meta.columns.find((c) => c.isPrimary);
        if (!pk) {
            throw new Error(
                `Entity "${this.entityCtor.name}" has no primary column. ` +
                `Add @PrimaryGeneratedColumn() or @PrimaryColumn() to one of its fields.`
            );
        }
        return pk;
    }

    private get persistableColumns(): (ColumnMetadata | ForeignKeyMetadata)[] {
        return [...this.meta.columns, ...this.meta.foreignKeys];
    }

    protected mapRow(row: Record<string, any>): T {
        const instance = Object.create(this.entityCtor.prototype) as T;

        this.meta.columns.forEach((col) => {
            (instance as any)[col.propertyName] = row[col.columnName];
        });

        this.meta.foreignKeys.forEach((fk) => {
            (instance as any)[fk.propertyName] = row[fk.columnName];
        });

        return instance;
    }

    async findById(id: ID): Promise<T | null> {
        const pk = this.primaryColumn;
        const result = await getQueryRunner().query(
            `SELECT * FROM ${this.qualifiedTable} WHERE ${pk.columnName} = $1`,
            [id]
        );
        return result.rows[0] ? this.mapRow(result.rows[0]) : null;
    }

    async findAll(): Promise<T[]> {
        const result = await getQueryRunner().query(`SELECT * FROM ${this.qualifiedTable}`);
        return result.rows.map((row: Record<string, any>) => this.mapRow(row));
    }

    async findAllById(ids: ID[]): Promise<T[]> {
        if (ids.length === 0) return [];
        const pk = this.primaryColumn;
        const result = await getQueryRunner().query(
            `SELECT * FROM ${this.qualifiedTable} WHERE ${pk.columnName} = ANY($1)`,
            [ids]
        );
        return result.rows.map((row: Record<string, any>) => this.mapRow(row));
    }

    async existsById(id: ID): Promise<boolean> {
        const pk = this.primaryColumn;
        const result = await getQueryRunner().query(
            `SELECT 1 FROM ${this.qualifiedTable} WHERE ${pk.columnName} = $1 LIMIT 1`,
            [id]
        );
        return (result.rowCount ?? 0) > 0;
    }

    async count(): Promise<number> {
        const result = await getQueryRunner().query(`SELECT COUNT(*)::int AS count FROM ${this.qualifiedTable}`);
        return Number(result.rows[0].count);
    }

    async save(entity: T): Promise<T> {
        const pk = this.primaryColumn;
        const columns = this.persistableColumns;

        const insertColumnNames = columns.map((c) => c.columnName);
        const values = columns.map((c) => (entity as any)[c.propertyName]);
        const placeholders = values.map((_, i) => `$${i + 1}`);

        const updatableColumns = columns.filter((c) => {
            const isPk = "isPrimary" in c && c.isPrimary;
            const isCreatedAt = "isCreatedAt" in c && c.isCreatedAt;
            return !isPk && !isCreatedAt;
        });
        const updateClause = updatableColumns.length > 0
            ? `DO UPDATE SET ${updatableColumns.map((c) => `${c.columnName} = EXCLUDED.${c.columnName}`).join(", ")}`
            : "DO NOTHING";

        const sql = `
            INSERT INTO ${this.qualifiedTable} (${insertColumnNames.join(", ")})
            VALUES (${placeholders.join(", ")})
            ON CONFLICT (${pk.columnName}) ${updateClause}
            RETURNING *`;

        const result = await getQueryRunner().query(sql, values);
        return this.mapRow(result.rows[0]);
    }

    async deleteById(id: ID): Promise<void> {
        const pk = this.primaryColumn;
        await getQueryRunner().query(`DELETE FROM ${this.qualifiedTable} WHERE ${pk.columnName} = $1`, [id]);
    }

    async delete(entity: T): Promise<void> {
        const pk = this.primaryColumn;
        await this.deleteById((entity as any)[pk.propertyName]);
    }
}