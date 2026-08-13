import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Pool } from 'pg';
import { getWorkspaceSchemaName } from '../sql/get-workspace-schema-name';
import { isUserFieldType } from '../sql/field-types';
import { toSnakeIdentifier } from '../sql/names';
import { PG_POOL } from '../workspace.constants';
import { parseFieldRow } from './object-metadata.service';
import { addObjectColumn, dropObjectColumn } from './tenant-ddl';
import type {
  FieldMetadataRow,
  ObjectMetadataRow,
  SelectOption,
} from './types';

const RESERVED_FIELD_NAMES = new Set([
  'id',
  'created_at',
  'updated_at',
  'deleted_at',
]);

@Injectable()
export class FieldMetadataService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async create(
    organizationId: string,
    objectId: string,
    input: {
      name: string;
      type: string;
      isNullable?: boolean;
      options?: SelectOption[];
    },
  ): Promise<FieldMetadataRow> {
    const label = input.name.trim();
    if (!label) {
      throw new BadRequestException('Field name is required');
    }
    if (!isUserFieldType(input.type)) {
      throw new BadRequestException('Unsupported field type');
    }

    const name = toSnakeIdentifier(label);
    if (!name || !/^[a-z][a-z0-9_]*$/.test(name)) {
      throw new BadRequestException(
        'Field name must start with a letter and contain only letters, numbers, and spaces',
      );
    }
    if (RESERVED_FIELD_NAMES.has(name)) {
      throw new BadRequestException('That field name is reserved');
    }

    const options = normalizeSelectOptions(input.type, input.options);
    const isNullable = input.isNullable !== false;
    const schemaName = getWorkspaceSchemaName(organizationId);
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const object = await this.requireObject(client, organizationId, objectId);

      const clash = await client.query(
        `SELECT id FROM field_metadata
         WHERE object_metadata_id = $1 AND name = $2
         LIMIT 1`,
        [objectId, name],
      );
      if (clash.rowCount && clash.rowCount > 0) {
        throw new BadRequestException(
          'A field with this name already exists on the object',
        );
      }

      const positionResult = await client.query<{ position: number }>(
        `SELECT COALESCE(MAX(position), -1) + 1 AS position
         FROM field_metadata
         WHERE object_metadata_id = $1`,
        [objectId],
      );

      const inserted = await client.query<FieldMetadataRow>(
        `INSERT INTO field_metadata (
           organization_id,
           object_metadata_id,
           name,
           label,
           type,
           is_custom,
           is_nullable,
           is_system,
           options,
           position
         ) VALUES ($1, $2, $3, $4, $5, true, $6, false, $7, $8)
         RETURNING *`,
        [
          organizationId,
          objectId,
          name,
          label,
          input.type,
          isNullable,
          options,
          positionResult.rows[0]?.position ?? 0,
        ],
      );

      await addObjectColumn(
        client,
        schemaName,
        object.target_table_name,
        name,
        input.type,
        isNullable,
      );

      await client.query('COMMIT');
      return parseFieldRow(inserted.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async update(
    organizationId: string,
    fieldId: string,
    patch: { label?: string; options?: SelectOption[] },
  ): Promise<FieldMetadataRow> {
    const client = await this.pool.connect();
    try {
      const field = await this.requireField(client, organizationId, fieldId);
      const label = patch.label?.trim() ?? field.label;
      if (!label) {
        throw new BadRequestException('Field name cannot be empty');
      }

      const options =
        patch.options !== undefined
          ? normalizeSelectOptions(field.type, patch.options)
          : field.options;

      const updated = await client.query<FieldMetadataRow>(
        `UPDATE field_metadata
         SET label = $1,
             options = $2,
             updated_at = now()
         WHERE id = $3 AND organization_id = $4
         RETURNING *`,
        [
          label,
          options,
          fieldId,
          organizationId,
        ],
      );

      return parseFieldRow(updated.rows[0]);
    } finally {
      client.release();
    }
  }

  async remove(organizationId: string, fieldId: string): Promise<void> {
    const schemaName = getWorkspaceSchemaName(organizationId);
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const field = await this.requireField(client, organizationId, fieldId);
      if (!field.is_custom) {
        throw new BadRequestException('Standard fields cannot be deleted');
      }

      const object = await this.requireObject(
        client,
        organizationId,
        field.object_metadata_id,
      );

      await dropObjectColumn(
        client,
        schemaName,
        object.target_table_name,
        field.name,
      );

      await client.query(
        `DELETE FROM field_metadata WHERE id = $1 AND organization_id = $2`,
        [fieldId, organizationId],
      );
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async requireObject(
    client: { query: Pool['query'] },
    organizationId: string,
    objectId: string,
  ): Promise<ObjectMetadataRow> {
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
    return object;
  }

  private async requireField(
    client: { query: Pool['query'] },
    organizationId: string,
    fieldId: string,
  ): Promise<FieldMetadataRow> {
    const result = await client.query<FieldMetadataRow>(
      `SELECT * FROM field_metadata
       WHERE id = $1 AND organization_id = $2
       LIMIT 1`,
      [fieldId, organizationId],
    );
    const field = result.rows[0];
    if (!field) {
      throw new NotFoundException('Field not found');
    }
    return parseFieldRow(field);
  }
}

function normalizeSelectOptions(
  type: string,
  options: SelectOption[] | null | undefined,
): SelectOption[] | null {
  if (type !== 'SELECT') {
    return null;
  }
  const cleaned = (options ?? [])
    .map((option) => ({
      value: option.value?.trim() ?? '',
      label: option.label?.trim() ?? '',
    }))
    .filter((option) => option.value && option.label);
  if (cleaned.length === 0) {
    throw new BadRequestException('Select fields need at least one option');
  }
  return cleaned;
}
