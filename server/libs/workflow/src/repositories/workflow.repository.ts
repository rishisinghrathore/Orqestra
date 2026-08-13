import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import { PG_POOL, getWorkspaceSchemaName } from '@app/workspace';
import type {
  WorkflowAction,
  WorkflowAutomatedTriggerRow,
  WorkflowRow,
  WorkflowRunRow,
  WorkflowRunState,
  WorkflowRunStatus,
  WorkflowTrigger,
  WorkflowVersionRow,
  WorkflowVersionStatus,
} from '../types/workflow.types';
import { AutomatedTriggerType } from '../types/workflow.types';

@Injectable()
export class WorkflowRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  private schema(organizationId: string) {
    return getWorkspaceSchemaName(organizationId);
  }

  async listWorkflows(organizationId: string): Promise<WorkflowRow[]> {
    const schema = this.schema(organizationId);
    const { rows } = await this.pool.query<WorkflowRow>(
      `SELECT * FROM ${schema}.workflow
       WHERE deleted_at IS NULL
       ORDER BY position ASC, created_at DESC`,
    );
    return rows;
  }

  async getWorkflow(
    organizationId: string,
    workflowId: string,
  ): Promise<WorkflowRow | null> {
    const schema = this.schema(organizationId);
    const { rows } = await this.pool.query<WorkflowRow>(
      `SELECT * FROM ${schema}.workflow
       WHERE id = $1 AND deleted_at IS NULL`,
      [workflowId],
    );
    return rows[0] ?? null;
  }

  async createWorkflow(
    organizationId: string,
    name: string,
  ): Promise<WorkflowRow> {
    const schema = this.schema(organizationId);
    const { rows } = await this.pool.query<WorkflowRow>(
      `INSERT INTO ${schema}.workflow (name, position)
       VALUES ($1, 0)
       RETURNING *`,
      [name],
    );
    return rows[0];
  }

  async updateWorkflowName(
    organizationId: string,
    workflowId: string,
    name: string,
  ): Promise<void> {
    const schema = this.schema(organizationId);
    await this.pool.query(
      `UPDATE ${schema}.workflow
       SET name = $2, updated_at = now()
       WHERE id = $1`,
      [workflowId, name],
    );
  }

  async updateWorkflowLastPublishedVersion(
    organizationId: string,
    workflowId: string,
    versionId: string,
  ): Promise<void> {
    const schema = this.schema(organizationId);
    await this.pool.query(
      `UPDATE ${schema}.workflow
       SET last_published_version_id = $2, updated_at = now()
       WHERE id = $1`,
      [workflowId, versionId],
    );
  }

  async listVersionsForWorkflow(
    organizationId: string,
    workflowId: string,
  ): Promise<WorkflowVersionRow[]> {
    const schema = this.schema(organizationId);
    const { rows } = await this.pool.query<WorkflowVersionRow>(
      `SELECT * FROM ${schema}.workflow_version
       WHERE workflow_id = $1 AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [workflowId],
    );
    return rows;
  }

  async getVersion(
    organizationId: string,
    versionId: string,
  ): Promise<WorkflowVersionRow | null> {
    const schema = this.schema(organizationId);
    const { rows } = await this.pool.query<WorkflowVersionRow>(
      `SELECT * FROM ${schema}.workflow_version
       WHERE id = $1 AND deleted_at IS NULL`,
      [versionId],
    );
    return rows[0] ?? null;
  }

  async getDraftVersion(
    organizationId: string,
    workflowId: string,
  ): Promise<WorkflowVersionRow | null> {
    const schema = this.schema(organizationId);
    const { rows } = await this.pool.query<WorkflowVersionRow>(
      `SELECT * FROM ${schema}.workflow_version
       WHERE workflow_id = $1
         AND status = 'DRAFT'
         AND deleted_at IS NULL
       ORDER BY created_at DESC
       LIMIT 1`,
      [workflowId],
    );
    return rows[0] ?? null;
  }

  async createVersion(
    organizationId: string,
    input: {
      workflowId: string;
      name?: string;
      trigger?: WorkflowTrigger | null;
      steps?: WorkflowAction[] | null;
      status?: WorkflowVersionStatus;
    },
  ): Promise<WorkflowVersionRow> {
    const schema = this.schema(organizationId);
    const { rows } = await this.pool.query<WorkflowVersionRow>(
      `INSERT INTO ${schema}.workflow_version (
         workflow_id, name, trigger, steps, status, position
       ) VALUES ($1, $2, $3::jsonb, $4::jsonb, $5, 0)
       RETURNING *`,
      [
        input.workflowId,
        input.name ?? null,
        input.trigger ? JSON.stringify(input.trigger) : null,
        input.steps ? JSON.stringify(input.steps) : null,
        input.status ?? 'DRAFT',
      ],
    );
    return rows[0];
  }

  async updateVersion(
    organizationId: string,
    versionId: string,
    input: {
      name?: string;
      trigger?: WorkflowTrigger | null;
      steps?: WorkflowAction[] | null;
      status?: WorkflowVersionStatus;
    },
  ): Promise<WorkflowVersionRow> {
    const schema = this.schema(organizationId);
    const { rows } = await this.pool.query<WorkflowVersionRow>(
      `UPDATE ${schema}.workflow_version
       SET name = COALESCE($2, name),
           trigger = COALESCE($3::jsonb, trigger),
           steps = COALESCE($4::jsonb, steps),
           status = COALESCE($5, status),
           updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [
        versionId,
        input.name ?? null,
        input.trigger !== undefined
          ? JSON.stringify(input.trigger)
          : null,
        input.steps !== undefined ? JSON.stringify(input.steps) : null,
        input.status ?? null,
      ],
    );
    return rows[0];
  }

  async archiveActiveVersions(
    organizationId: string,
    workflowId: string,
    exceptVersionId?: string,
  ): Promise<void> {
    const schema = this.schema(organizationId);
    if (exceptVersionId) {
      await this.pool.query(
        `UPDATE ${schema}.workflow_version
         SET status = 'ARCHIVED', updated_at = now()
         WHERE workflow_id = $1 AND status = 'ACTIVE' AND id <> $2`,
        [workflowId, exceptVersionId],
      );
      return;
    }
    await this.pool.query(
      `UPDATE ${schema}.workflow_version
       SET status = 'ARCHIVED', updated_at = now()
       WHERE workflow_id = $1 AND status = 'ACTIVE'`,
      [workflowId],
    );
  }

  async countRunsForWorkflow(
    organizationId: string,
    workflowId: string,
  ): Promise<number> {
    const schema = this.schema(organizationId);
    const { rows } = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM ${schema}.workflow_run
       WHERE workflow_id = $1 AND deleted_at IS NULL`,
      [workflowId],
    );
    return Number(rows[0]?.count ?? 0);
  }

  async listRunsForWorkflow(
    organizationId: string,
    workflowId: string,
    limit = 50,
  ): Promise<WorkflowRunRow[]> {
    const schema = this.schema(organizationId);
    const { rows } = await this.pool.query<WorkflowRunRow>(
      `SELECT * FROM ${schema}.workflow_run
       WHERE workflow_id = $1 AND deleted_at IS NULL
       ORDER BY created_at DESC
       LIMIT $2`,
      [workflowId, limit],
    );
    return rows;
  }

  async getRun(
    organizationId: string,
    runId: string,
  ): Promise<WorkflowRunRow | null> {
    const schema = this.schema(organizationId);
    const { rows } = await this.pool.query<WorkflowRunRow>(
      `SELECT * FROM ${schema}.workflow_run
       WHERE id = $1 AND deleted_at IS NULL`,
      [runId],
    );
    return rows[0] ?? null;
  }

  async createRun(
    organizationId: string,
    input: {
      workflowId: string;
      workflowVersionId: string;
      name: string;
      status: WorkflowRunStatus;
      state: WorkflowRunState;
      runId?: string;
    },
  ): Promise<WorkflowRunRow> {
    const schema = this.schema(organizationId);
    const enqueuedAt =
      input.status === 'ENQUEUED' || input.status === 'RUNNING'
        ? new Date()
        : null;
    const { rows } = await this.pool.query<WorkflowRunRow>(
      `INSERT INTO ${schema}.workflow_run (
         id, name, status, enqueued_at, state, workflow_id, workflow_version_id
       ) VALUES (
         COALESCE($1::uuid, gen_random_uuid()), $2, $3, $4, $5::jsonb, $6, $7
       )
       RETURNING *`,
      [
        input.runId ?? null,
        input.name,
        input.status,
        enqueuedAt,
        JSON.stringify(input.state),
        input.workflowId,
        input.workflowVersionId,
      ],
    );
    return rows[0];
  }

  async updateRun(
    organizationId: string,
    runId: string,
    partial: {
      status?: WorkflowRunStatus;
      state?: WorkflowRunState;
      started_at?: Date | null;
      ended_at?: Date | null;
    },
  ): Promise<WorkflowRunRow> {
    const schema = this.schema(organizationId);
    const { rows } = await this.pool.query<WorkflowRunRow>(
      `UPDATE ${schema}.workflow_run
       SET status = COALESCE($2, status),
           state = COALESCE($3::jsonb, state),
           started_at = COALESCE($4, started_at),
           ended_at = COALESCE($5, ended_at),
           updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [
        runId,
        partial.status ?? null,
        partial.state ? JSON.stringify(partial.state) : null,
        partial.started_at ?? null,
        partial.ended_at ?? null,
      ],
    );
    return rows[0];
  }

  async listAutomatedTriggersByEvent(
    organizationId: string,
    eventName: string,
  ): Promise<WorkflowAutomatedTriggerRow[]> {
    const schema = this.schema(organizationId);
    const { rows } = await this.pool.query<WorkflowAutomatedTriggerRow>(
      `SELECT * FROM ${schema}.workflow_automated_trigger
       WHERE type = $1
         AND deleted_at IS NULL
         AND settings->>'eventName' = $2`,
      [AutomatedTriggerType.DATABASE_EVENT, eventName],
    );
    return rows;
  }

  async upsertAutomatedTrigger(
    organizationId: string,
    input: {
      workflowId: string;
      type: AutomatedTriggerType;
      settings: Record<string, unknown>;
    },
  ): Promise<void> {
    const schema = this.schema(organizationId);
    await this.pool.query(
      `DELETE FROM ${schema}.workflow_automated_trigger
       WHERE workflow_id = $1`,
      [input.workflowId],
    );
    await this.pool.query(
      `INSERT INTO ${schema}.workflow_automated_trigger (type, settings, workflow_id)
       VALUES ($1, $2::jsonb, $3)`,
      [input.type, JSON.stringify(input.settings), input.workflowId],
    );
  }

  async deleteAutomatedTrigger(
    organizationId: string,
    workflowId: string,
  ): Promise<void> {
    const schema = this.schema(organizationId);
    await this.pool.query(
      `DELETE FROM ${schema}.workflow_automated_trigger
       WHERE workflow_id = $1`,
      [workflowId],
    );
  }

  async deleteWorkflow(
    organizationId: string,
    workflowId: string,
  ): Promise<void> {
    const schema = this.schema(organizationId);
    await this.pool.query(
      `UPDATE ${schema}.workflow_version
       SET deleted_at = now(), updated_at = now()
       WHERE workflow_id = $1 AND deleted_at IS NULL`,
      [workflowId],
    );
    await this.pool.query(
      `UPDATE ${schema}.workflow
       SET deleted_at = now(), updated_at = now()
       WHERE id = $1 AND deleted_at IS NULL`,
      [workflowId],
    );
    await this.deleteAutomatedTrigger(organizationId, workflowId);
  }
}
