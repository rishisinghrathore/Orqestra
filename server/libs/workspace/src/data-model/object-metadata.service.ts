import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Pool, PoolClient } from 'pg';
import { CUSTOM_OBJECT_SYSTEM_FIELDS } from '../provision/standard-objects';
import { getWorkspaceSchemaName } from '../sql/get-workspace-schema-name';
import { toCamelIdentifier, toCustomTableName } from '../sql/names';
import { PG_POOL } from '../workspace.constants';
import { countObjectRecords, createObjectTable, dropObjectTable } from './tenant-ddl';
import type {
  FieldMetadataRow,
  ObjectMetadataRow,
  ObjectWithFields,
  SelectOption,
} from './types';

@Injectable()
export class ObjectMetadataService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async list(organizationId: string): Promise<ObjectWithFields[]> {
    const client = await this.pool.connect();
    try {
      const objects = await this.loadObjects(client, organizationId);
      const schemaName = getWorkspaceSchemaName(organizationId);
      const withCounts: ObjectWithFields[] = [];

      for (const object of objects) {
        const records = await countObjectRecords(
          client,
          schemaName,
          object.target_table_name,
        );
        withCounts.push({ ...object, records });
      }

      return withCounts;
    } finally {
      client.release();
    }
  }

  async getById(
    organizationId: string,
    objectId: string,
  ): Promise<ObjectWithFields> {
    const client = await this.pool.connect();
    try {
      const object = await this.loadObject(client, organizationId, objectId);
      const records = await countObjectRecords(
        client,
        getWorkspaceSchemaName(organizationId),
        object.target_table_name,
      );
      return { ...object, records };
    } finally {
      client.release();
    }
  }

  async create(
    organizationId: string,
    input: {
      singularName: string;
      pluralName: string;
      description?: string;
    },
  ): Promise<ObjectWithFields> {
    const labelSingular = input.singularName.trim();
    const labelPlural = input.pluralName.trim();
    if (!labelSingular) {
      throw new BadRequestException('Singular name is required');
    }
    if (!labelPlural) {
      throw new BadRequestException('Plural name is required');
    }

    const nameSingular = toCamelIdentifier(labelSingular);
    const namePlural = toCamelIdentifier(labelPlural);
    if (!nameSingular || !/^[a-z][a-zA-Z0-9]*$/.test(nameSingular)) {
      throw new BadRequestException(
        'Singular name must start with a letter and contain only letters and numbers',
      );
    }
    if (!namePlural || !/^[a-z][a-zA-Z0-9]*$/.test(namePlural)) {
      throw new BadRequestException(
        'Plural name must start with a letter and contain only letters and numbers',
      );
    }
    if (nameSingular === namePlural) {
      throw new BadRequestException(
        'Singular and plural names must be different',
      );
    }

    const tableName = toCustomTableName(nameSingular);
    const schemaName = getWorkspaceSchemaName(organizationId);
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const clash = await client.query(
        `SELECT id FROM object_metadata
         WHERE organization_id = $1
           AND (name_singular = $2 OR name_plural = $3 OR target_table_name = $4)
         LIMIT 1`,
        [organizationId, nameSingular, namePlural, tableName],
      );
      if (clash.rowCount && clash.rowCount > 0) {
        throw new BadRequestException(
          'An object with this name already exists in the workspace',
        );
      }

      const inserted = await client.query<ObjectMetadataRow>(
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
         ) VALUES ($1, $2, $3, $4, $5, $6, true, true, $7)
         RETURNING *`,
        [
          organizationId,
          nameSingular,
          namePlural,
          labelSingular,
          labelPlural,
          input.description?.trim() ?? '',
          tableName,
        ],
      );
      const object = inserted.rows[0];

      for (const field of CUSTOM_OBJECT_SYSTEM_FIELDS) {
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
           ) VALUES ($1, $2, $3, $4, $5, false, $6, $7, $8)`,
          [
            organizationId,
            object.id,
            field.name,
            field.label,
            field.type,
            field.isNullable,
            field.isSystem,
            field.position,
          ],
        );
      }

      await createObjectTable(client, schemaName, tableName);
      const loaded = await this.loadObject(client, organizationId, object.id);
      await client.query('COMMIT');
      return { ...loaded, records: 0 };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async update(
    organizationId: string,
    objectId: string,
    patch: {
      singularName?: string;
      pluralName?: string;
      description?: string;
    },
  ): Promise<ObjectWithFields> {
    const client = await this.pool.connect();
    try {
      const current = await this.loadObject(client, organizationId, objectId);
      const labelSingular = patch.singularName?.trim() ?? current.label_singular;
      const labelPlural = patch.pluralName?.trim() ?? current.label_plural;
      const description =
        patch.description !== undefined
          ? patch.description.trim()
          : current.description;

      if (!labelSingular || !labelPlural) {
        throw new BadRequestException('Object names cannot be empty');
      }

      await client.query(
        `UPDATE object_metadata
         SET label_singular = $1,
             label_plural = $2,
             description = $3,
             updated_at = now()
         WHERE id = $4 AND organization_id = $5`,
        [labelSingular, labelPlural, description, objectId, organizationId],
      );

      return this.getById(organizationId, objectId);
    } finally {
      client.release();
    }
  }

  async remove(organizationId: string, objectId: string): Promise<void> {
    const schemaName = getWorkspaceSchemaName(organizationId);
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      const object = await this.loadObject(client, organizationId, objectId);

      if (!object.is_custom) {
        throw new BadRequestException('Standard objects cannot be deleted');
      }

      await dropObjectTable(
        client,
        schemaName,
        object.target_table_name,
      );

      await client.query(
        `DELETE FROM object_metadata WHERE id = $1 AND organization_id = $2`,
        [objectId, organizationId],
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async loadObjects(
    client: PoolClient,
    organizationId: string,
  ): Promise<ObjectWithFields[]> {
    const objects = await client.query<ObjectMetadataRow>(
      `SELECT * FROM object_metadata
       WHERE organization_id = $1
       ORDER BY label_plural ASC`,
      [organizationId],
    );
    const fields = await client.query<FieldMetadataRow>(
      `SELECT * FROM field_metadata
       WHERE organization_id = $1
       ORDER BY position ASC, label ASC`,
      [organizationId],
    );

    const fieldsByObject = new Map<string, FieldMetadataRow[]>();
    for (const field of fields.rows) {
      const parsed = parseFieldRow(field);
      const list = fieldsByObject.get(parsed.object_metadata_id) ?? [];
      list.push(parsed);
      fieldsByObject.set(parsed.object_metadata_id, list);
    }

    return objects.rows.map((object) => ({
      ...object,
      fields: fieldsByObject.get(object.id) ?? [],
      records: 0,
    }));
  }

  private async loadObject(
    client: PoolClient,
    organizationId: string,
    objectId: string,
  ): Promise<ObjectWithFields> {
    const result = await client.query<ObjectMetadataRow>(
      `SELECT * FROM object_metadata
       WHERE id = $1 AND organization_id = $2
       LIMIT 1`,
      [objectId, organizationId],
    );
    const object = result.rows[0];
    if (!object) {
      throw new NotFoundException('Object not found');
    }

    const fields = await client.query<FieldMetadataRow>(
      `SELECT * FROM field_metadata
       WHERE object_metadata_id = $1 AND organization_id = $2
       ORDER BY position ASC, label ASC`,
      [objectId, organizationId],
    );

    return {
      ...object,
      fields: fields.rows.map(parseFieldRow),
      records: 0,
    };
  }
}

export function parseFieldRow(row: FieldMetadataRow): FieldMetadataRow {
  return {
    ...row,
    options: normalizeOptions(row.options),
  };
}

function normalizeOptions(value: unknown): SelectOption[] | null {
  if (!value) return null;
  if (typeof value === 'string') {
    try {
      return normalizeOptions(JSON.parse(value));
    } catch {
      return null;
    }
  }
  if (!Array.isArray(value)) return null;
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const option = item as { value?: unknown; label?: unknown };
      if (typeof option.value !== 'string' || typeof option.label !== 'string') {
        return null;
      }
      return { value: option.value, label: option.label };
    })
    .filter((item): item is SelectOption => item !== null);
}
