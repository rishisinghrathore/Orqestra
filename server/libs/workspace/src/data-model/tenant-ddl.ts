import type { PoolClient } from 'pg';
import type { FieldType } from '../sql/field-types';
import { sqlTypeForField } from '../sql/field-types';
import { quoteIdent, quoteTable } from '../sql/quote-ident';

export async function createObjectTable(
  client: PoolClient,
  schemaName: string,
  tableName: string,
) {
  const table = quoteTable(schemaName, tableName);
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${table} (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      deleted_at timestamptz
    )
  `);
}

export async function addObjectColumn(
  client: PoolClient,
  schemaName: string,
  tableName: string,
  columnName: string,
  type: FieldType,
  isNullable: boolean,
) {
  const table = quoteTable(schemaName, tableName);
  const column = quoteIdent(columnName);
  const sqlType = sqlTypeForField(type);
  const nullSql = isNullable ? '' : ' NOT NULL';
  await client.query(
    `ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${column} ${sqlType}${nullSql}`,
  );
}

export async function dropObjectColumn(
  client: PoolClient,
  schemaName: string,
  tableName: string,
  columnName: string,
) {
  const table = quoteTable(schemaName, tableName);
  const column = quoteIdent(columnName);
  await client.query(`ALTER TABLE ${table} DROP COLUMN IF EXISTS ${column}`);
}

export async function dropObjectTable(
  client: PoolClient,
  schemaName: string,
  tableName: string,
) {
  const table = quoteTable(schemaName, tableName);
  await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
}

export async function countObjectRecords(
  client: PoolClient,
  schemaName: string,
  tableName: string,
): Promise<number> {
  const table = quoteTable(schemaName, tableName);
  try {
    const result = await client.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM ${table} WHERE deleted_at IS NULL`,
    );
    return Number(result.rows[0]?.count ?? 0);
  } catch {
    return 0;
  }
}
