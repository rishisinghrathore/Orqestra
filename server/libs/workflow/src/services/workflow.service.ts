import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ObjectMetadataService } from '@app/workspace';
import { RUN_WORKFLOW_JOB_NAME } from '../constants/job-names';
import { MessageQueue } from '../queue/message-queue.constants';
import { MessageQueueService } from '../queue/message-queue.service';
import { WorkflowRepository } from '../repositories/workflow.repository';
import {
  AutomatedTriggerType,
  WorkflowRunStatus,
  WorkflowTriggerType,
  WorkflowVersionStatus,
  type WorkflowAction,
  type WorkflowTrigger,
} from '../types/workflow.types';
import { WorkflowRunService } from './workflow-run.service';

@Injectable()
export class WorkflowRunnerService {
  constructor(
    private readonly repo: WorkflowRepository,
    private readonly runService: WorkflowRunService,
    private readonly queue: MessageQueueService,
  ) {}

  async run({
    organizationId,
    workflowVersionId,
    payload,
    workflowRunId,
  }: {
    organizationId: string;
    workflowVersionId: string;
    payload: object;
    workflowRunId?: string;
  }) {
    const version = await this.repo.getVersion(organizationId, workflowVersionId);
    if (!version?.trigger || !version.steps) {
      throw new BadRequestException('Workflow version has no trigger or steps');
    }

    const workflow = await this.repo.getWorkflow(
      organizationId,
      version.workflow_id,
    );
    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    const runCount = await this.repo.countRunsForWorkflow(
      organizationId,
      workflow.id,
    );

    const state = this.runService.buildInitState(
      version.trigger,
      version.steps,
      payload,
    );

    const run = await this.repo.createRun(organizationId, {
      workflowId: workflow.id,
      workflowVersionId: version.id,
      name: `#${runCount + 1} - ${workflow.name ?? 'Workflow'}`,
      status: WorkflowRunStatus.ENQUEUED,
      state,
      runId: workflowRunId,
    });

    await this.queue.add(
      MessageQueue.workflowQueue,
      RUN_WORKFLOW_JOB_NAME,
      {
        organizationId,
        workflowRunId: run.id,
      },
      { jobId: `run-${run.id}` },
    );

    return run;
  }
}

@Injectable()
export class WorkflowService {
  constructor(
    private readonly repo: WorkflowRepository,
    private readonly objects: ObjectMetadataService,
    private readonly runner: WorkflowRunnerService,
  ) {}

  async list(organizationId: string) {
    const workflows = await this.repo.listWorkflows(organizationId);
    return Promise.all(
      workflows.map(async (workflow) => {
        const draft = await this.repo.getDraftVersion(
          organizationId,
          workflow.id,
        );
        const activeVersion = workflow.last_published_version_id
          ? await this.repo.getVersion(
              organizationId,
              workflow.last_published_version_id,
            )
          : null;
        const runs = await this.repo.countRunsForWorkflow(
          organizationId,
          workflow.id,
        );
        return { ...workflow, draftVersion: draft, activeVersion, runs };
      }),
    );
  }

  async create(organizationId: string, name: string) {
    const workflow = await this.repo.createWorkflow(organizationId, name);
    const version = await this.repo.createVersion(organizationId, {
      workflowId: workflow.id,
      name,
      status: WorkflowVersionStatus.DRAFT,
    });
    return { workflow, draftVersion: version };
  }

  async get(organizationId: string, workflowId: string) {
    const workflow = await this.repo.getWorkflow(organizationId, workflowId);
    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }
    const draftVersion =
      (await this.repo.getDraftVersion(organizationId, workflowId)) ??
      (workflow.last_published_version_id
        ? await this.repo.getVersion(
            organizationId,
            workflow.last_published_version_id,
          )
        : null);
    const runs = await this.repo.listRunsForWorkflow(
      organizationId,
      workflowId,
    );
    return { workflow, draftVersion, runs };
  }

  async listRuns(organizationId: string, workflowId: string) {
    const workflow = await this.repo.getWorkflow(organizationId, workflowId);
    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }
    return this.repo.listRunsForWorkflow(organizationId, workflowId);
  }

  async getRun(organizationId: string, workflowId: string, runId: string) {
    const workflow = await this.repo.getWorkflow(organizationId, workflowId);
    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }
    const run = await this.repo.getRun(organizationId, runId);
    if (!run || run.workflow_id !== workflowId) {
      throw new NotFoundException('Workflow run not found');
    }
    return run;
  }

  async saveDraft(
    organizationId: string,
    workflowId: string,
    input: {
      name?: string;
      trigger?: WorkflowTrigger | null;
      steps?: WorkflowAction[] | null;
    },
  ) {
    const workflow = await this.repo.getWorkflow(organizationId, workflowId);
    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    let draft = await this.repo.getDraftVersion(organizationId, workflowId);
    if (!draft) {
      draft = await this.repo.createVersion(organizationId, {
        workflowId,
        name: input.name ?? workflow.name ?? 'Workflow',
        trigger: input.trigger,
        steps: input.steps,
        status: WorkflowVersionStatus.DRAFT,
      });
    } else {
      draft = await this.repo.updateVersion(organizationId, draft.id, {
        name: input.name ?? draft.name ?? workflow.name ?? 'Workflow',
        trigger: input.trigger,
        steps: input.steps,
      });
    }

    if (input.name && input.name !== workflow.name) {
      await this.repo.updateWorkflowName(
        organizationId,
        workflowId,
        input.name,
      );
    }

    return draft;
  }

  async publish(organizationId: string, workflowId: string) {
    const workflow = await this.repo.getWorkflow(organizationId, workflowId);
    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    const draft = await this.repo.getDraftVersion(organizationId, workflowId);
    if (!draft?.trigger || !draft.steps?.length) {
      throw new BadRequestException(
        'Workflow must have a trigger and at least one step before publishing',
      );
    }

    await this.repo.archiveActiveVersions(organizationId, workflowId, draft.id);
    const published = await this.repo.updateVersion(
      organizationId,
      draft.id,
      { status: WorkflowVersionStatus.ACTIVE },
    );
    await this.repo.updateWorkflowLastPublishedVersion(
      organizationId,
      workflowId,
      published.id,
    );

    if (published.trigger?.type === WorkflowTriggerType.DATABASE_EVENT) {
      await this.repo.upsertAutomatedTrigger(organizationId, {
        workflowId,
        type: AutomatedTriggerType.DATABASE_EVENT,
        settings: published.trigger.settings,
      });
    } else {
      await this.repo.deleteAutomatedTrigger(organizationId, workflowId);
    }

    return published;
  }

  async deactivate(organizationId: string, workflowId: string) {
    const workflow = await this.repo.getWorkflow(organizationId, workflowId);
    if (!workflow?.last_published_version_id) {
      throw new BadRequestException('Workflow is not published');
    }

    await this.repo.updateVersion(
      organizationId,
      workflow.last_published_version_id,
      { status: WorkflowVersionStatus.DEACTIVATED },
    );
    await this.repo.deleteAutomatedTrigger(organizationId, workflowId);
    return { ok: true };
  }

  async delete(organizationId: string, workflowId: string) {
    const workflow = await this.repo.getWorkflow(organizationId, workflowId);
    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    await this.repo.deleteWorkflow(organizationId, workflowId);
    return { ok: true };
  }

  async triggerManual(
    organizationId: string,
    workflowId: string,
    payload: object = {},
  ) {
    const workflow = await this.repo.getWorkflow(organizationId, workflowId);
    if (!workflow?.last_published_version_id) {
      throw new BadRequestException('Workflow has no published version');
    }

    const version = await this.repo.getVersion(
      organizationId,
      workflow.last_published_version_id,
    );
    if (!version || version.status !== WorkflowVersionStatus.ACTIVE) {
      throw new BadRequestException('Published workflow version is not active');
    }

    return this.runner.run({
      organizationId,
      workflowVersionId: version.id,
      payload,
    });
  }

  async resolveObjectNameSingular(
    organizationId: string,
    objectId: string,
  ): Promise<string> {
    const object = await this.objects.getById(organizationId, objectId);
    return object.name_singular;
  }
}
