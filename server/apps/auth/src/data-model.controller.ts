import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  FieldMetadataService,
  ObjectMetadataService,
  RecordService,
  fieldTypeLabel,
  type FieldMetadataRow,
  type ObjectWithFields,
  type SelectOption,
} from '@app/workspace';
import { DatabaseEventAction, DatabaseEventService } from '@app/workflow';
import { OrganizationAccessService } from './organization-access.service';

@Controller('api/data-model')
export class DataModelController {
  constructor(
    private readonly access: OrganizationAccessService,
    private readonly objects: ObjectMetadataService,
    private readonly fields: FieldMetadataService,
    private readonly records: RecordService,
    private readonly databaseEvents: DatabaseEventService,
  ) {}

  @Get('objects')
  async list(
    @Req() req: Request,
    @Query('organizationId') organizationId?: string,
  ) {
    const org = await this.access.requireOrganization(
      req.headers,
      organizationId,
    );
    const rows = await this.objects.list(org.organizationId);
    return { objects: rows.map(toObjectDto) };
  }

  @Post('objects')
  async create(
    @Req() req: Request,
    @Query('organizationId') organizationId: string | undefined,
    @Body()
    body: {
      singularName?: string;
      pluralName?: string;
      description?: string;
    },
  ) {
    const org = await this.access.requireOrganization(
      req.headers,
      organizationId,
    );
    const created = await this.objects.create(org.organizationId, {
      singularName: body.singularName ?? '',
      pluralName: body.pluralName ?? '',
      description: body.description,
    });
    return toObjectDto(created);
  }

  @Get('objects/:objectId')
  async getOne(
    @Req() req: Request,
    @Param('objectId') objectId: string,
    @Query('organizationId') organizationId?: string,
  ) {
    const org = await this.access.requireOrganization(
      req.headers,
      organizationId,
    );
    const object = await this.objects.getById(org.organizationId, objectId);
    return toObjectDto(object);
  }

  @Patch('objects/:objectId')
  async update(
    @Req() req: Request,
    @Param('objectId') objectId: string,
    @Query('organizationId') organizationId: string | undefined,
    @Body()
    body: {
      singularName?: string;
      pluralName?: string;
      description?: string;
    },
  ) {
    const org = await this.access.requireOrganization(
      req.headers,
      organizationId,
    );
    const updated = await this.objects.update(org.organizationId, objectId, body);
    return toObjectDto(updated);
  }

  @Delete('objects/:objectId')
  async deleteObject(
    @Req() req: Request,
    @Param('objectId') objectId: string,
    @Query('organizationId') organizationId?: string,
  ) {
    const org = await this.access.requireOrganization(
      req.headers,
      organizationId,
    );
    await this.objects.remove(org.organizationId, objectId);
    return { ok: true };
  }

  @Post('objects/:objectId/fields')
  async createField(
    @Req() req: Request,
    @Param('objectId') objectId: string,
    @Query('organizationId') organizationId: string | undefined,
    @Body()
    body: {
      name?: string;
      type?: string;
      isNullable?: boolean;
      options?: SelectOption[];
    },
  ) {
    const org = await this.access.requireOrganization(
      req.headers,
      organizationId,
    );
    const field = await this.fields.create(org.organizationId, objectId, {
      name: body.name ?? '',
      type: body.type ?? '',
      isNullable: body.isNullable,
      options: body.options,
    });
    return toFieldDto(field);
  }

  @Patch('fields/:fieldId')
  async updateField(
    @Req() req: Request,
    @Param('fieldId') fieldId: string,
    @Query('organizationId') organizationId: string | undefined,
    @Body() body: { label?: string; options?: SelectOption[] },
  ) {
    const org = await this.access.requireOrganization(
      req.headers,
      organizationId,
    );
    const field = await this.fields.update(org.organizationId, fieldId, body);
    return toFieldDto(field);
  }

  @Delete('fields/:fieldId')
  async deleteField(
    @Req() req: Request,
    @Param('fieldId') fieldId: string,
    @Query('organizationId') organizationId?: string,
  ) {
    const org = await this.access.requireOrganization(
      req.headers,
      organizationId,
    );
    await this.fields.remove(org.organizationId, fieldId);
    return { ok: true };
  }

  @Get('objects/:objectId/records')
  async listRecords(
    @Req() req: Request,
    @Param('objectId') objectId: string,
    @Query('organizationId') organizationId?: string,
  ) {
    const org = await this.access.requireOrganization(
      req.headers,
      organizationId,
    );
    const records = await this.records.list(org.organizationId, objectId);
    return { records };
  }

  @Post('objects/:objectId/records')
  async createRecord(
    @Req() req: Request,
    @Param('objectId') objectId: string,
    @Query('organizationId') organizationId: string | undefined,
    @Body() body: { fields?: Record<string, unknown> },
  ) {
    const org = await this.access.requireOrganization(
      req.headers,
      organizationId,
    );
    const object = await this.objects.getById(org.organizationId, objectId);
    const record = await this.records.create(
      org.organizationId,
      objectId,
      body.fields ?? {},
    );

    await this.databaseEvents.emitRecordEvent({
      organizationId: org.organizationId,
      objectNameSingular: object.name_singular,
      action: DatabaseEventAction.CREATED,
      record: {
        id: record.id,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        ...record.fields,
      },
    });

    return { record };
  }

  @Patch('objects/:objectId/records/:recordId')
  async updateRecord(
    @Req() req: Request,
    @Param('objectId') objectId: string,
    @Param('recordId') recordId: string,
    @Query('organizationId') organizationId: string | undefined,
    @Body() body: { fields?: Record<string, unknown> },
  ) {
    const org = await this.access.requireOrganization(
      req.headers,
      organizationId,
    );
    const object = await this.objects.getById(org.organizationId, objectId);
    const updated = await this.records.update(
      org.organizationId,
      objectId,
      recordId,
      body.fields ?? {},
    );

    await this.databaseEvents.emitRecordEvent({
      organizationId: org.organizationId,
      objectNameSingular: object.name_singular,
      action: DatabaseEventAction.UPDATED,
      record: {
        id: updated.after.id,
        createdAt: updated.after.createdAt,
        updatedAt: updated.after.updatedAt,
        ...updated.after.fields,
      },
      before: {
        id: updated.before.id,
        createdAt: updated.before.createdAt,
        updatedAt: updated.before.updatedAt,
        ...updated.before.fields,
      },
      updatedFields: updated.updatedFields,
    });

    return { record: updated.after };
  }

  @Delete('objects/:objectId/records/:recordId')
  async deleteRecord(
    @Req() req: Request,
    @Param('objectId') objectId: string,
    @Param('recordId') recordId: string,
    @Query('organizationId') organizationId?: string,
  ) {
    const org = await this.access.requireOrganization(
      req.headers,
      organizationId,
    );
    const object = await this.objects.getById(org.organizationId, objectId);
    const record = await this.records.remove(
      org.organizationId,
      objectId,
      recordId,
    );

    await this.databaseEvents.emitRecordEvent({
      organizationId: org.organizationId,
      objectNameSingular: object.name_singular,
      action: DatabaseEventAction.DELETED,
      record: {
        id: record.id,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        ...record.fields,
      },
      before: {
        id: record.id,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        ...record.fields,
      },
    });

    return { ok: true };
  }
}

const toObjectDto = (object: ObjectWithFields) => ({
  id: object.id,
  singularName: object.label_singular,
  pluralName: object.label_plural,
  description: object.description,
  app: object.is_custom ? 'custom' : 'standard',
  records: object.records,
  fields: object.fields.map(toFieldDto),
  relations: [] as { id: string; name: string; app: string; type: string }[],
});

const toFieldDto = (field: FieldMetadataRow) => ({
  id: field.id,
  key: field.name,
  name: field.label,
  app: field.is_custom ? 'custom' : 'standard',
  dataType: fieldTypeLabel(field.type),
  type: field.type,
  isCustom: field.is_custom,
  isSystem: field.is_system,
  options: field.options,
});
