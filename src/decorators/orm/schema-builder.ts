import {
  ColumnMetadata, ColumnType, EntityMetadata, ForeignKeyMetadata, getAllEntities,
} from "@decorators/orm/column.decorator";

function mapColumnType(col: ColumnMetadata): string {
  switch (col.type) {
    case ColumnType.VARCHAR: return `VARCHAR(${col.length ?? 255})`;
    case ColumnType.CHAR: return `CHAR(${col.length ?? 1})`;
    case ColumnType.DECIMAL:
    case ColumnType.NUMERIC: return `${col.type}(${col.precision ?? 12}, ${col.scale ?? 2})`;
    case ColumnType.ENUM: {
      const values = (col.enumValues ?? []).map((v) => `'${v}'`).join(", ");
      return `VARCHAR(50) CHECK (${col.columnName} IN (${values}))`;
    }
    default: return col.type;
  }
}

function buildColumnLine(col: ColumnMetadata): string {
  let line = `  ${col.columnName} ${mapColumnType(col)}`;
  if (col.isPrimary) line += " PRIMARY KEY";
  if (col.default) line += ` DEFAULT ${col.default}`;
  if (!col.nullable && !col.isPrimary) line += " NOT NULL";
  if (col.unique && !col.isPrimary) line += " UNIQUE";
  return line;
}

function resolveForeignKeyTable(fk: ForeignKeyMetadata): string {
  const resolver = (fk as any)._resolveTable as (() => string) | undefined;
  return resolver ? resolver() : fk.referencedTable;
}

export function buildCreateTableSQL(entity: EntityMetadata): string {
  const qualifiedTable = `${entity.schemaName}.${entity.tableName}`;
  const columnLines = entity.columns.map(buildColumnLine);
  const hasUpdatedAt = entity.columns.some((c) => c.isUpdatedAt);

  let sql = `CREATE EXTENSION IF NOT EXISTS "pgcrypto";\n\n`;

  if (entity.schemaName !== "public") {
    sql += `CREATE SCHEMA IF NOT EXISTS ${entity.schemaName};\n\n`;
  }

  const fkColumnLines = entity.foreignKeys.map((fk) => {
    let line = `  ${fk.columnName} UUID`;
    if (!fk.nullable) line += " NOT NULL";
    if (fk.unique) line += " UNIQUE";
    return line;
  });

  const allColumnLines = [...columnLines, ...fkColumnLines];
  sql += `CREATE TABLE IF NOT EXISTS ${qualifiedTable} (\n${allColumnLines.join(",\n")}`;

  entity.foreignKeys.forEach((fk) => {
    const refTable = resolveForeignKeyTable(fk);
    sql += `,\n  CONSTRAINT fk_${entity.tableName}_${fk.columnName} FOREIGN KEY (${fk.columnName}) REFERENCES ${entity.schemaName}.${refTable}(${fk.referencedColumn}) ON DELETE ${fk.onDelete}`;
  });

  sql += `\n);\n`;

  // Auto-index dari unique column & FK (perilaku lama, tetap dipertahankan)
  entity.columns
    .filter((c) => c.unique && !c.isPrimary)
    .forEach((c) => {
      sql += `\nCREATE INDEX IF NOT EXISTS idx_${entity.tableName}_${c.columnName} ON ${qualifiedTable}(${c.columnName});\n`;
    });

  entity.foreignKeys.forEach((fk) => {
    sql += `\nCREATE INDEX IF NOT EXISTS idx_${entity.tableName}_${fk.columnName} ON ${qualifiedTable}(${fk.columnName});\n`;
  });

  entity.indexes.forEach((idx) => {
    const idxName = idx.name ?? `idx_${entity.tableName}_${idx.columns.join("_")}`;
    const uniqueKw = idx.unique ? "UNIQUE " : "";
    sql += `\nCREATE ${uniqueKw}INDEX IF NOT EXISTS ${idxName} ON ${qualifiedTable}(${idx.columns.join(", ")});\n`;
  });

  if (hasUpdatedAt) {
    const updatedCol = entity.columns.find((c) => c.isUpdatedAt)!;
    const fnName = `trigger_set_${entity.schemaName}_${entity.tableName}_updated_at`;
    sql += `
-- Auto-update ${updatedCol.columnName} setiap kali row diupdate
CREATE OR REPLACE FUNCTION ${fnName}()
RETURNS TRIGGER AS $$
BEGIN
  NEW.${updatedCol.columnName} = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON ${qualifiedTable};
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON ${qualifiedTable}
FOR EACH ROW EXECUTE FUNCTION ${fnName}();
`;
  }

  return sql;
}

export function buildManyToManyJoinTableSQL(entity: EntityMetadata): string[] {
  const statements: string[] = [];

  entity.manyToMany.forEach((rel) => {
    const targetEntityFn = rel.targetEntity();
    const targetMeta = getAllEntities().find((e) => e.target === targetEntityFn);
    if (!targetMeta) {
      console.warn(`Cannot resolve target entity for @ManyToMany "${rel.propertyName}" on ${entity.target.name}`);
      return;
    }

    const joinTable = rel.joinTable ?? `${entity.tableName}_${targetMeta.tableName}`;
    const joinColumn = rel.joinColumn ?? `${entity.tableName.replace(/s$/, "")}_id`;
    const inverseJoinColumn = rel.inverseJoinColumn ?? `${targetMeta.tableName.replace(/s$/, "")}_id`;
    const qualifiedJoinTable = `${entity.schemaName}.${joinTable}`;

    let sql = `CREATE TABLE IF NOT EXISTS ${qualifiedJoinTable} (\n`;
    sql += `  ${joinColumn} UUID NOT NULL REFERENCES ${entity.schemaName}.${entity.tableName}(id) ON DELETE CASCADE,\n`;
    sql += `  ${inverseJoinColumn} UUID NOT NULL REFERENCES ${targetMeta.schemaName}.${targetMeta.tableName}(id) ON DELETE CASCADE,\n`;
    sql += `  PRIMARY KEY (${joinColumn}, ${inverseJoinColumn})\n`;
    sql += `);\n`;
    sql += `\nCREATE INDEX IF NOT EXISTS idx_${joinTable}_${inverseJoinColumn} ON ${qualifiedJoinTable}(${inverseJoinColumn});\n`;

    statements.push(sql);
  });

  return statements;
}

export function buildDropTableSQL(entity: EntityMetadata): string {
  const qualifiedTable = `${entity.schemaName}.${entity.tableName}`;
  let sql = "";

  const hasUpdatedAt = entity.columns.some((c) => c.isUpdatedAt);
  if (hasUpdatedAt) {
    const fnName = `trigger_set_${entity.schemaName}_${entity.tableName}_updated_at`;
    sql += `DROP TRIGGER IF EXISTS set_updated_at ON ${qualifiedTable};\n`;
    sql += `DROP FUNCTION IF EXISTS ${fnName}();\n\n`;
  }

  sql += `DROP TABLE IF EXISTS ${qualifiedTable} CASCADE;\n`;
  return sql;
}

/** DOWN migration untuk join table @ManyToMany — harus di-drop SEBELUM tabel utama */
export function buildDropJoinTableSQL(entity: EntityMetadata): string[] {
  return entity.manyToMany
    .map((rel) => {
      const targetEntityFn = rel.targetEntity();
      const targetMeta = getAllEntities().find((e) => e.target === targetEntityFn);
      if (!targetMeta) return "";
      const joinTable = rel.joinTable ?? `${entity.tableName}_${targetMeta.tableName}`;
      return `DROP TABLE IF EXISTS ${entity.schemaName}.${joinTable} CASCADE;\n`;
    })
    .filter(Boolean);
}