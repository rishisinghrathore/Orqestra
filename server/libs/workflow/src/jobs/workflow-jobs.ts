import { Injectable } from '@nestjs/common';
import {
  RESUME_DELAYED_WORKFLOW_JOB_NAME,
  RUN_WORKFLOW_JOB_NAME,
  WORKFLOW_TRIGGER_JOB_NAME,
} from '../constants/job-names';
import { MessageQueue } from '../queue/message-queue.constants';
import { MessageQueueService } from '../queue/message-queue.service';
import { WorkflowRepository } from '../repositories/workflow.repository';
import {
  StepStatus,
  WorkflowRunStatus,
  WorkflowVersionStatus,
  type DatabaseEventPayload,
} from '../types/workflow.types';
import { WorkflowExecutorService } from '../services/workflow-executor.service';
import { WorkflowRunService } from '../services/workflow-run.service';
import { WorkflowRunnerService } from '../services/workflow.service';

export type WorkflowTriggerJobData = {
  organizationId: string;
  workflowId: string;
  payload: DatabaseEventPayload;
};

@Injectable()
export class WorkflowTriggerJobHandler {
  constructor(
    private readonly repo: WorkflowRepository,
    private readonly runner: WorkflowRunnerService,
  ) {}

  async handle(data: WorkflowTriggerJobData) {
    const workflow = await this.repo.getWorkflow(
      data.organizationId,
      data.workflowId,
    );
    if (!workflow?.last_published_version_id) {
      return;
    }

    const version = await this.repo.getVersion(
      data.organizationId,
      workflow.last_published_version_id,
    );
    if (!version || version.status !== WorkflowVersionStatus.ACTIVE) {
      return;
    }

    await this.runner.run({
      organizationId: data.organizationId,
      workflowVersionId: version.id,
      payload: data.payload,
    });
  }
}

export type RunWorkflowJobData = {
  organizationId: string;
  workflowRunId: string;
  lastExecutedStepId?: string;
};

@Injectable()
export class RunWorkflowJobHandler {
  constructor(
    private readonly runService: WorkflowRunService,
    private readonly executor: WorkflowExecutorService,
  ) {}

  async handle(data: RunWorkflowJobData) {
    const run = await this.runService.getRunOrFail(
      data.organizationId,
      data.workflowRunId,
    );

    if (
      run.status !== WorkflowRunStatus.ENQUEUED &&
      run.status !== WorkflowRunStatus.RUNNING
    ) {
      return;
    }

    if (run.status === WorkflowRunStatus.ENQUEUED) {
      await this.runService.startRun(data.organizationId, data.workflowRunId);
    }

    if (data.lastExecutedStepId) {
      await this.executor.resumeFromStep({
        organizationId: data.organizationId,
        workflowRunId: data.workflowRunId,
        lastExecutedStepId: data.lastExecutedStepId,
      });
      return;
    }

    const trigger = run.state.flow.trigger;
    const stepIds = trigger.nextStepIds ?? [];
    await this.executor.executeFromSteps({
      organizationId: data.organizationId,
      workflowRunId: data.workflowRunId,
      stepIds,
    });
  }
}

export type ResumeDelayedWorkflowJobData = {
  organizationId: string;
  workflowRunId: string;
  stepId: string;
};

@Injectable()
export class ResumeDelayedWorkflowJobHandler {
  constructor(
    private readonly runService: WorkflowRunService,
    private readonly queue: MessageQueueService,
  ) {}

  async handle(data: ResumeDelayedWorkflowJobData) {
    const run = await this.runService.getRunOrFail(
      data.organizationId,
      data.workflowRunId,
    );

    if (run.status !== WorkflowRunStatus.RUNNING) {
      return;
    }

    const stepInfo = run.state.stepInfos[data.stepId];
    if (stepInfo?.status !== StepStatus.PENDING) {
      return;
    }

    await this.runService.updateStepInfo(
      data.organizationId,
      data.workflowRunId,
      data.stepId,
      {
        status: StepStatus.SUCCESS,
        result: { success: true },
      },
    );

    await this.queue.add(
      MessageQueue.workflowQueue,
      RUN_WORKFLOW_JOB_NAME,
      {
        organizationId: data.organizationId,
        workflowRunId: data.workflowRunId,
        lastExecutedStepId: data.stepId,
      },
      { jobId: `run-${data.workflowRunId}-resume-${data.stepId}` },
    );
  }
}

@Injectable()
export class WorkflowJobRegistrar {
  constructor(
    private readonly queue: MessageQueueService,
    private readonly triggerJob: WorkflowTriggerJobHandler,
    private readonly runJob: RunWorkflowJobHandler,
    private readonly resumeJob: ResumeDelayedWorkflowJobHandler,
  ) {
    this.queue.registerHandler(
      MessageQueue.workflowQueue,
      WORKFLOW_TRIGGER_JOB_NAME,
      (data) => this.triggerJob.handle(data as WorkflowTriggerJobData),
    );
    this.queue.registerHandler(
      MessageQueue.workflowQueue,
      RUN_WORKFLOW_JOB_NAME,
      (data) => this.runJob.handle(data as RunWorkflowJobData),
    );
    this.queue.registerHandler(
      MessageQueue.delayedJobsQueue,
      RESUME_DELAYED_WORKFLOW_JOB_NAME,
      (data) => this.resumeJob.handle(data as ResumeDelayedWorkflowJobData),
    );
  }
}
