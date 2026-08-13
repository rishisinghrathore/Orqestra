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
  DatabaseEventAction,
  DatabaseEventService,
  WorkflowService,
  type WorkflowAction,
  type WorkflowRunRow,
  type WorkflowTrigger,
} from '@app/workflow';
import { OrganizationAccessService } from './organization-access.service';

@Controller('api/workflows')
export class WorkflowController {
  constructor(
    private readonly access: OrganizationAccessService,
    private readonly workflows: WorkflowService,
    private readonly databaseEvents: DatabaseEventService,
  ) {}

  @Get()
  async list(
    @Req() req: Request,
    @Query('organizationId') organizationId?: string,
  ) {
    const org = await this.access.requireOrganization(
      req.headers,
      organizationId,
    );
    const items = await this.workflows.list(org.organizationId);
    return {
      workflows: items.map((item) => ({
        id: item.id,
        name: item.name,
        runs: item.runs,
        status: item.activeVersion?.status ?? 'DRAFT',
        draftVersionId: item.draftVersion?.id ?? null,
        publishedVersionId: item.last_published_version_id,
        updatedAt: item.updated_at,
      })),
    };
  }

  @Post()
  async create(
    @Req() req: Request,
    @Query('organizationId') organizationId: string | undefined,
    @Body() body: { name?: string },
  ) {
    const org = await this.access.requireOrganization(
      req.headers,
      organizationId,
    );
    const created = await this.workflows.create(
      org.organizationId,
      body.name?.trim() || 'Untitled workflow',
    );
    return {
      workflow: created.workflow,
      draftVersion: created.draftVersion,
    };
  }

  @Get(':workflowId')
  async getOne(
    @Req() req: Request,
    @Param('workflowId') workflowId: string,
    @Query('organizationId') organizationId?: string,
  ) {
    const org = await this.access.requireOrganization(
      req.headers,
      organizationId,
    );
    const detail = await this.workflows.get(org.organizationId, workflowId);
    return {
      workflow: detail.workflow,
      draftVersion: detail.draftVersion,
      runs: detail.runs.map(toRunSummary),
    };
  }

  @Get(':workflowId/runs')
  async listRuns(
    @Req() req: Request,
    @Param('workflowId') workflowId: string,
    @Query('organizationId') organizationId?: string,
  ) {
    const org = await this.access.requireOrganization(
      req.headers,
      organizationId,
    );
    const runs = await this.workflows.listRuns(org.organizationId, workflowId);
    return { runs: runs.map(toRunSummary) };
  }

  @Get(':workflowId/runs/:runId')
  async getRun(
    @Req() req: Request,
    @Param('workflowId') workflowId: string,
    @Param('runId') runId: string,
    @Query('organizationId') organizationId?: string,
  ) {
    const org = await this.access.requireOrganization(
      req.headers,
      organizationId,
    );
    const run = await this.workflows.getRun(
      org.organizationId,
      workflowId,
      runId,
    );
    return { run: toRunDetail(run) };
  }

  @Patch(':workflowId/draft')
  async saveDraft(
    @Req() req: Request,
    @Param('workflowId') workflowId: string,
    @Query('organizationId') organizationId: string | undefined,
    @Body()
    body: {
      name?: string;
      trigger?: WorkflowTrigger | null;
      steps?: WorkflowAction[] | null;
    },
  ) {
    const org = await this.access.requireOrganization(
      req.headers,
      organizationId,
    );
    const draft = await this.workflows.saveDraft(
      org.organizationId,
      workflowId,
      body,
    );
    return { draftVersion: draft };
  }

  @Post(':workflowId/publish')
  async publish(
    @Req() req: Request,
    @Param('workflowId') workflowId: string,
    @Query('organizationId') organizationId?: string,
  ) {
    const org = await this.access.requireOrganization(
      req.headers,
      organizationId,
    );
    const version = await this.workflows.publish(
      org.organizationId,
      workflowId,
    );
    return { version };
  }

  @Post(':workflowId/deactivate')
  async deactivate(
    @Req() req: Request,
    @Param('workflowId') workflowId: string,
    @Query('organizationId') organizationId?: string,
  ) {
    const org = await this.access.requireOrganization(
      req.headers,
      organizationId,
    );
    return this.workflows.deactivate(org.organizationId, workflowId);
  }

  @Delete(':workflowId')
  async delete(
    @Req() req: Request,
    @Param('workflowId') workflowId: string,
    @Query('organizationId') organizationId?: string,
  ) {
    const org = await this.access.requireOrganization(
      req.headers,
      organizationId,
    );
    return this.workflows.delete(org.organizationId, workflowId);
  }

  @Post(':workflowId/run')
  async run(
    @Req() req: Request,
    @Param('workflowId') workflowId: string,
    @Query('organizationId') organizationId: string | undefined,
    @Body() body: { payload?: Record<string, unknown> },
  ) {
    const org = await this.access.requireOrganization(
      req.headers,
      organizationId,
    );
    const run = await this.workflows.triggerManual(
      org.organizationId,
      workflowId,
      body.payload ?? {},
    );
    return { run };
  }

  @Post('events/record')
  async emitRecordEvent(
    @Req() req: Request,
    @Query('organizationId') organizationId: string | undefined,
    @Body()
    body: {
      objectNameSingular?: string;
      action?: DatabaseEventAction;
      record?: Record<string, unknown>;
      before?: Record<string, unknown>;
      updatedFields?: string[];
    },
  ) {
    const org = await this.access.requireOrganization(
      req.headers,
      organizationId,
    );

    if (!body.objectNameSingular || !body.action || !body.record) {
      return {
        ok: false,
        message: 'objectNameSingular, action, and record are required',
      };
    }

    await this.databaseEvents.emitRecordEvent({
      organizationId: org.organizationId,
      objectNameSingular: body.objectNameSingular,
      action: body.action,
      record: body.record,
      before: body.before,
      updatedFields: body.updatedFields,
    });

    return { ok: true };
  }
}

const toRunSummary = (run: WorkflowRunRow) => ({
  id: run.id,
  name: run.name,
  status: run.status,
  startedAt: run.started_at,
  endedAt: run.ended_at,
  enqueuedAt: run.enqueued_at,
  createdAt: run.created_at,
  error: run.state?.workflowRunError ?? null,
});

const toRunDetail = (run: WorkflowRunRow) => ({
  ...toRunSummary(run),
  state: run.state,
});
