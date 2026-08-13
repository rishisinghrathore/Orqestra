import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Pool, PoolClient } from 'pg';
import { getWorkspaceSchemaName } from '../sql/get-workspace-schema-name';
import { quoteIdent, quoteTable } from '../sql/quote-ident';
import type { FieldType } from '../sql/field-types';
import { PG_POOL } from '../workspace.constants';
import { ObjectMetadataService } from './object-metadata.service';
import type { FieldMetadataRow, ObjectWithFields } from './types';

export type ObjectRecordRow = {
  id: string;
  createdAt: string;
  updatedAt: string;
  fields: Record<string, unknown>;
};

@Injectable()
export class RecordService {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly objects: ObjectMetadataService,
  ) {}

  async list(
    organizationId: string,
    objectId: string,
    limit = 100,
  ): Promise<ObjectRecordRow[]> {
    const object = await this.objects.getById(organizationId, objectId);
    const client = await this.pool.connect();
    try {
      const rows = await this.queryRecords(client, object, limit);
      return rows.map((row) => this.toRecordDto(row, object));
    } finally {
      client.release();
    }
  }

  async create(
    organizationId: string,
    objectId: string,
    fields: Record<string, unknown>,
  ): Promise<ObjectRecordRow> {
    const object = await this.objects.getById(organizationId, objectId);
    const assignments = this.resolveAssignments(object, fields);

    const schemaName = getWorkspaceSchemaName(organizationId);
    const table = quoteTable(schemaName, object.target_table_name);
    const client = await this.pool.connect();

    try {
      const columnNames = assignments.map(({ column }) => quoteIdent(column));
      const placeholders = assignments.map((_, index) => `$${index + 1}`);
      const values = assignments.map(({ value }) => value);

      const insertSql =
        assignments.length > 0
          ? `INSERT INTO ${table} (${columnNames.join(', ')})
             VALUES (${placeholders.join(', ')})
             RETURNING *`
          : `INSERT INTO ${table} DEFAULT VALUES RETURNING *`;

      const result = await client.query<Record<string, unknown>>(
        insertSql,
        values,
      );
      const row = result.rows[0];
      if (!row) {
        throw new BadRequestException('Failed to create record');
      }
      return this.toRecordDto(row, object);
    } finally {
      client.release();
    }
  }

  async getById(
    organizationId: string,
    objectId: string,
    recordId: string,
  ): Promise<ObjectRecordRow> {
    const object = await this.objects.getById(organizationId, objectId);
    const schemaName = getWorkspaceSchemaName(organizationId);
    const table = quoteTable(schemaName, object.target_table_name);
    const client = await this.pool.connect();

    try {
      const result = await client.query<Record<string, unknown>>(
        `SELECT * FROM ${table}
         WHERE id = $1 AND deleted_at IS NULL
         LIMIT 1`,
        [recordId],
      );
      const row = result.rows[0];
      if (!row) {
        throw new NotFoundException('Record not found');
      }
      return this.toRecordDto(row, object);
    } finally {
      client.release();
    }
  }

  async update(
    organizationId: string,
    objectId: string,
    recordId: string,
    fields: Record<string, unknown>,
  ): Promise<{
    before: ObjectRecordRow;
    after: ObjectRecordRow;
    updatedFields: string[];
  }> {
    const object = await this.objects.getById(organizationId, objectId);
    const assignments = this.resolveAssignments(object, fields);
    if (assignments.length === 0) {
      throw new BadRequestException('No fields to update');
    }

    const before = await this.getById(organizationId, objectId, recordId);
    const schemaName = getWorkspaceSchemaName(organizationId);
    const table = quoteTable(schemaName, object.target_table_name);
    const client = await this.pool.connect();

    try {
      const setClauses = assignments.map(
        ({ column }, index) => `${quoteIdent(column)} = $${index + 1}`,
      );
      const values = assignments.map(({ value }) => value);
      const result = await client.query<Record<string, unknown>>(
        `UPDATE ${table}
         SET ${setClauses.join(', ')}, updated_at = now()
         WHERE id = $${values.length + 1} AND deleted_at IS NULL
         RETURNING *`,
        [...values, recordId],
      );
      const row = result.rows[0];
      if (!row) {
        throw new NotFoundException('Record not found');
      }
      return {
        before,
        after: this.toRecordDto(row, object),
        updatedFields: assignments.map(({ column }) => column),
      };
    } finally {
      client.release();
    }
  }

  async remove(
    organizationId: string,
    objectId: string,
    recordId: string,
  ): Promise<ObjectRecordRow> {
    const object = await this.objects.getById(organizationId, objectId);
    const before = await this.getById(organizationId, objectId, recordId);
    const schemaName = getWorkspaceSchemaName(organizationId);
    const table = quoteTable(schemaName, object.target_table_name);
    const client = await this.pool.connect();

    try {
      const result = await client.query<Record<string, unknown>>(
        `UPDATE ${table}
         SET deleted_at = now(), updated_at = now()
         WHERE id = $1 AND deleted_at IS NULL
         RETURNING *`,
        [recordId],
      );
      if (!result.rows[0]) {
        throw new NotFoundException('Record not found');
      }
      return before;
    } finally {
      client.release();
    }
  }

  private resolveAssignments(
    object: ObjectWithFields,
    fields: Record<string, unknown>,
  ) {
    const editableFields = object.fields.filter((field) => !field.is_system);
    const fieldByName = new Map(
      editableFields.map((field) => [field.name, field]),
    );
    const fieldByLabel = new Map(
      editableFields.map((field) => [field.label.toLowerCase(), field]),
    );

    const assignments: { column: string; value: unknown }[] = [];
    for (const [key, rawValue] of Object.entries(fields)) {
      if (rawValue === undefined || rawValue === null || rawValue === '') {
        continue;
      }
      const field =
        fieldByName.get(key) ?? fieldByLabel.get(key.toLowerCase());
      if (!field) {
        throw new BadRequestException(`Unknown field: ${key}`);
      }
      assignments.push({
        column: field.name,
        value: this.coerceFieldValue(field, rawValue),
      });
    }
    return assignments;
  }

  private async queryRecords(
    client: PoolClient,
    object: ObjectWithFields,
    limit: number,
  ) {
    const schemaName = getWorkspaceSchemaName(object.organization_id);
    const table = quoteTable(schemaName, object.target_table_name);
    try {
      const result = await client.query<Record<string, unknown>>(
        `SELECT * FROM ${table}
         WHERE deleted_at IS NULL
         ORDER BY created_at DESC
         LIMIT $1`,
        [limit],
      );
      return result.rows;
    } catch {
      throw new NotFoundException('Object table is not available');
    }
  }

  private toRecordDto(
    row: Record<string, unknown>,
    object: ObjectWithFields,
  ): ObjectRecordRow {
    const fieldByColumn = new Map(
      object.fields.map((field) => [field.name, field]),
    );
    const fields: Record<string, unknown> = {};

    for (const [column, value] of Object.entries(row)) {
      if (['id', 'created_at', 'updated_at', 'deleted_at'].includes(column)) {
        continue;
      }
      const field = fieldByColumn.get(column);
      fields[field?.label ?? column] = value;
    }

    return {
      id: String(row.id),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
      fields,
    };
  }

  private coerceFieldValue(field: FieldMetadataRow, rawValue: unknown) {
    switch (field.type as FieldType) {
      case 'NUMBER':
        return Number(rawValue);
      case 'BOOLEAN':
        return rawValue === true || rawValue === 'true';
      case 'DATE':
      case 'DATETIME':
      case 'TEXT':
      case 'SELECT':
        return String(rawValue);
      default:
        return rawValue;
    }
  }
}
