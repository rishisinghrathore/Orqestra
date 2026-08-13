import type { Pool } from 'pg';
import { getWorkspaceSchemaName } from './get-workspace-schema-name';

type ProvisionSchemaInput = {
  pool: Pool;
  organizationId: string;
};

/**
 * Creates an isolated Postgres schema for a tenant workspace and seeds
 * the baseline CRM / workflow tables used by Orqestra.
 */
export async function provisionWorkspaceSchema({
  pool,
  organizationId,
}: ProvisionSchemaInput): Promise<string> {
  const schemaName = getWorkspaceSchemaName(organizationId);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`CREATE SCHEMA IF NOT EXISTS ${quoteIdent(schemaName)}`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS ${quoteIdent(schemaName)}.company (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        domain text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        deleted_at timestamptz
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS ${quoteIdent(schemaName)}.person (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        first_name text,
        last_name text,
        email text,
        company_id uuid REFERENCES ${quoteIdent(schemaName)}.company(id) ON DELETE SET NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        deleted_at timestamptz
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS ${quoteIdent(schemaName)}.note (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        body text NOT NULL DEFAULT '',
        author_id text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        deleted_at timestamptz
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS ${quoteIdent(schemaName)}.workflow (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text,
        last_published_version_id uuid,
        statuses text[] DEFAULT ARRAY[]::text[],
        position double precision NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        deleted_at timestamptz
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS ${quoteIdent(schemaName)}.workflow_version (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text,
        trigger jsonb,
        steps jsonb,
        status text NOT NULL DEFAULT 'DRAFT',
        workflow_id uuid NOT NULL REFERENCES ${quoteIdent(schemaName)}.workflow(id) ON DELETE CASCADE,
        position double precision NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        deleted_at timestamptz
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS workflow_version_workflow_id_idx
        ON ${quoteIdent(schemaName)}.workflow_version (workflow_id)
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS ${quoteIdent(schemaName)}.workflow_run (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text,
        status text NOT NULL DEFAULT 'NOT_STARTED',
        enqueued_at timestamptz,
        started_at timestamptz,
        ended_at timestamptz,
        state jsonb NOT NULL DEFAULT '{}'::jsonb,
        step_logs jsonb,
        workflow_id uuid NOT NULL REFERENCES ${quoteIdent(schemaName)}.workflow(id) ON DELETE CASCADE,
        workflow_version_id uuid REFERENCES ${quoteIdent(schemaName)}.workflow_version(id) ON DELETE SET NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        deleted_at timestamptz
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS workflow_run_workflow_id_idx
        ON ${quoteIdent(schemaName)}.workflow_run (workflow_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS workflow_run_workflow_version_id_idx
        ON ${quoteIdent(schemaName)}.workflow_run (workflow_version_id)
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS ${quoteIdent(schemaName)}.workflow_automated_trigger (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        type text NOT NULL DEFAULT 'DATABASE_EVENT',
        settings jsonb NOT NULL DEFAULT '{}'::jsonb,
        workflow_id uuid NOT NULL REFERENCES ${quoteIdent(schemaName)}.workflow(id) ON DELETE CASCADE,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        deleted_at timestamptz
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS workflow_automated_trigger_workflow_id_idx
        ON ${quoteIdent(schemaName)}.workflow_automated_trigger (workflow_id)
    `);

    // Persist schema name on the org for later lookups.
    await client.query(
      `UPDATE organization
       SET metadata = $1
       WHERE id = $2
         AND (metadata IS NULL OR metadata = '')`,
      [JSON.stringify({ databaseSchema: schemaName }), organizationId],
    );

    await client.query('COMMIT');
    return schemaName;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

function quoteIdent(identifier: string): string {
  if (!/^[a-z_][a-z0-9_]*$/i.test(identifier)) {
    throw new Error(`Invalid SQL identifier: ${identifier}`);
  }
  return `"${identifier.replace(/"/g, '""')}"`;
}
