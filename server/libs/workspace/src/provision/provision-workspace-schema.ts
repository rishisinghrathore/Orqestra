import type { Pool, PoolClient } from 'pg';
import { getWorkspaceSchemaName } from '../sql/get-workspace-schema-name';
import { quoteIdent } from '../sql/quote-ident';
import { STANDARD_OBJECTS } from './standard-objects';

type Queryable = Pool | PoolClient;

type ProvisionSchemaInput = {
  pool: Queryable;
  organizationId: string;
};

const seedObjectMetadata = async (
  client: Queryable,
  organizationId: string,
) => {
  for (const object of STANDARD_OBJECTS) {
    const existing = await client.query<{ id: string }>(
      `SELECT id FROM object_metadata
       WHERE organization_id = $1 AND name_singular = $2
       LIMIT 1`,
      [organizationId, object.nameSingular],
    );

    const objectId =
      existing.rows[0]?.id ??
      (
        await client.query<{ id: string }>(
          `INSERT INTO object_metadata (
             organization_id,
             name_singular,
             name_plural,
             label_singular,
             label_plural,
             description,
             is_custom,
             is_active,
             target_table_name
           ) VALUES ($1, $2, $3, $4, $5, $6, false, true, $7)
           RETURNING id`,
          [
            organizationId,
            object.nameSingular,
            object.namePlural,
            object.labelSingular,
            object.labelPlural,
            object.description,
            object.targetTableName,
          ],
        )
      ).rows[0].id;

    for (const field of object.fields) {
      await client.query(
        `INSERT INTO field_metadata (
           organization_id,
           object_metadata_id,
           name,
           label,
           type,
           is_custom,
           is_nullable,
           is_system,
           position
         ) VALUES ($1, $2, $3, $4, $5, false, $6, $7, $8)
         ON CONFLICT (object_metadata_id, name) DO NOTHING`,
        [
          organizationId,
          objectId,
          field.name,
          field.label,
          field.type,
          field.isNullable,
          field.isSystem,
          field.position,
        ],
      );
    }
  }
};

/**
 * Creates an isolated Postgres schema for a tenant workspace and seeds
 * the baseline CRM / workflow tables plus object/field metadata.
 */
export async function provisionWorkspaceSchema({
  pool,
  organizationId,
}: ProvisionSchemaInput): Promise<string> {
  const schemaName = getWorkspaceSchemaName(organizationId);
  const schema = quoteIdent(schemaName);

  const ownsClient = !('release' in pool);
  const client = ownsClient ? await (pool as Pool).connect() : (pool as PoolClient);

  try {
    await client.query('BEGIN');

    await client.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS ${schema}.company (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        domain text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        deleted_at timestamptz
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS ${schema}.person (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        first_name text,
        last_name text,
        email text,
        company_id uuid REFERENCES ${schema}.company(id) ON DELETE SET NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        deleted_at timestamptz
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS ${schema}.note (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        body text NOT NULL DEFAULT '',
        author_id text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        deleted_at timestamptz
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS ${schema}.workflow (
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
      CREATE TABLE IF NOT EXISTS ${schema}.workflow_version (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text,
        trigger jsonb,
        steps jsonb,
        status text NOT NULL DEFAULT 'DRAFT',
        workflow_id uuid NOT NULL REFERENCES ${schema}.workflow(id) ON DELETE CASCADE,
        position double precision NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        deleted_at timestamptz
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS workflow_version_workflow_id_idx
        ON ${schema}.workflow_version (workflow_id)
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS ${schema}.workflow_run (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text,
        status text NOT NULL DEFAULT 'NOT_STARTED',
        enqueued_at timestamptz,
        started_at timestamptz,
        ended_at timestamptz,
        state jsonb NOT NULL DEFAULT '{}'::jsonb,
        step_logs jsonb,
        workflow_id uuid NOT NULL REFERENCES ${schema}.workflow(id) ON DELETE CASCADE,
        workflow_version_id uuid REFERENCES ${schema}.workflow_version(id) ON DELETE SET NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        deleted_at timestamptz
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS workflow_run_workflow_id_idx
        ON ${schema}.workflow_run (workflow_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS workflow_run_workflow_version_id_idx
        ON ${schema}.workflow_run (workflow_version_id)
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS ${schema}.workflow_automated_trigger (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        type text NOT NULL DEFAULT 'DATABASE_EVENT',
        settings jsonb NOT NULL DEFAULT '{}'::jsonb,
        workflow_id uuid NOT NULL REFERENCES ${schema}.workflow(id) ON DELETE CASCADE,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        deleted_at timestamptz
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS workflow_automated_trigger_workflow_id_idx
        ON ${schema}.workflow_automated_trigger (workflow_id)
    `);

    await seedObjectMetadata(client, organizationId);

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
    if (ownsClient) {
      (client as PoolClient).release();
    }
  }
}
