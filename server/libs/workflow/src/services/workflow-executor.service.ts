import { Injectable } from '@nestjs/common';
import {
  MAX_EXECUTED_STEPS_COUNT,
  RUN_WORKFLOW_JOB_NAME,
} from '../constants/job-names';
import { MessageQueue } from '../queue/message-queue.constants';
import { MessageQueueService } from '../queue/message-queue.service';
import { WorkflowActionFactory } from '../actions/workflow-actions';
import { WorkflowRunService } from './workflow-run.service';
import {
  StepStatus,
  WorkflowRunStatus,
  type WorkflowAction,
  type WorkflowActionOutput,
} from '../types/workflow.types';
import { getWorkflowRunContext } from '../utils/get-workflow-run-context';

@Injectable()
export class WorkflowExecutorService {
  constructor(
    private readonly runService: WorkflowRunService,
    private readonly actionFactory: WorkflowActionFactory,
    private readonly queue: MessageQueueService,
  ) {}

  async executeFromSteps({
    organizationId,
    workflowRunId,
    stepIds,
    executedStepsCount = 0,
  }: {
    organizationId: string;
    workflowRunId: string;
    stepIds: string[];
    executedStepsCount?: number;
  }) {
    for (const stepId of stepIds) {
      const shouldContinue = await this.executeFromStep({
        organizationId,
        workflowRunId,
        stepId,
        executedStepsCount,
      });
      if (!shouldContinue) {
        return;
      }
    }

    await this.computeWorkflowRunStatus(organizationId, workflowRunId);
  }

  private async executeFromStep({
    organizationId,
    workflowRunId,
    stepId,
    executedStepsCount,
  }: {
    organizationId: string;
    workflowRunId: string;
    stepId: string;
    executedStepsCount: number;
  }): Promise<boolean> {
    const run = await this.runService.getRunOrFail(organizationId, workflowRunId);
    const step = run.state.flow.steps.find((candidate) => candidate.id === stepId);
    if (!step) {
      await this.runService.endRun(
        organizationId,
        workflowRunId,
        WorkflowRunStatus.FAILED,
        'Step not found',
      );
      return false;
    }

    await this.runService.updateStepInfo(organizationId, workflowRunId, stepId, {
      status: StepStatus.RUNNING,
    });

    const refreshed = await this.runService.getRunOrFail(
      organizationId,
      workflowRunId,
    );
    const action = this.actionFactory.get(String(step.type));
    let output: WorkflowActionOutput;
    try {
      output = await action.execute({
        currentStepId: stepId,
        steps: refreshed.state.flow.steps,
        context: getWorkflowRunContext(refreshed.state.stepInfos),
        runInfo: { workflowRunId, organizationId },
      });
    } catch (error) {
      output = {
        error: error instanceof Error ? error.message : 'Step execution failed',
      };
    }

    const shouldContinue = await this.processStepResult({
      organizationId,
      workflowRunId,
      stepId,
      output,
    });
    if (!shouldContinue) {
      return false;
    }

    if (executedStepsCount >= MAX_EXECUTED_STEPS_COUNT) {
      await this.queue.add(
        MessageQueue.workflowQueue,
        RUN_WORKFLOW_JOB_NAME,
        {
          organizationId,
          workflowRunId,
          lastExecutedStepId: stepId,
        },
        { jobId: `run-${workflowRunId}-chunk-${stepId}` },
      );
      return false;
    }

    const nextStepIds = step.nextStepIds ?? [];
    if (nextStepIds.length > 0) {
      await this.executeFromSteps({
        organizationId,
        workflowRunId,
        stepIds: nextStepIds,
        executedStepsCount: executedStepsCount + 1,
      });
    }

    return true;
  }

  async resumeFromStep({
    organizationId,
    workflowRunId,
    lastExecutedStepId,
  }: {
    organizationId: string;
    workflowRunId: string;
    lastExecutedStepId: string;
  }) {
    const run = await this.runService.getRunOrFail(organizationId, workflowRunId);
    const lastStep = run.state.flow.steps.find(
      (candidate) => candidate.id === lastExecutedStepId,
    );
    if (!lastStep) {
      await this.runService.endRun(
        organizationId,
        workflowRunId,
        WorkflowRunStatus.FAILED,
        'Last executed step not found',
      );
      return;
    }

    const nextStepIds = lastStep.nextStepIds ?? [];
    if (nextStepIds.length === 0) {
      await this.computeWorkflowRunStatus(organizationId, workflowRunId);
      return;
    }

    await this.executeFromSteps({
      organizationId,
      workflowRunId,
      stepIds: nextStepIds,
      executedStepsCount: 0,
    });
  }

  private async processStepResult({
    organizationId,
    workflowRunId,
    stepId,
    output,
  }: {
    organizationId: string;
    workflowRunId: string;
    stepId: string;
    output: WorkflowActionOutput;
  }) {
    let stepInfo;
    if (output.pendingEvent) {
      stepInfo = { status: StepStatus.PENDING };
    } else if (output.result !== undefined) {
      stepInfo = { status: StepStatus.SUCCESS, result: output.result };
    } else if (output.shouldSkipStepExecution) {
      stepInfo = { status: StepStatus.SKIPPED };
    } else {
      stepInfo = {
        status: StepStatus.FAILED,
        error: output.error ?? 'Step failed',
      };
    }

    await this.runService.updateStepInfo(
      organizationId,
      workflowRunId,
      stepId,
      stepInfo,
    );

    if (output.pendingEvent) {
      return false;
    }

    if (stepInfo.status === StepStatus.FAILED) {
      await this.runService.endRun(
        organizationId,
        workflowRunId,
        WorkflowRunStatus.FAILED,
        stepInfo.error,
      );
      return false;
    }

    return true;
  }

  private async computeWorkflowRunStatus(
    organizationId: string,
    workflowRunId: string,
  ) {
    const run = await this.runService.getRunOrFail(organizationId, workflowRunId);
    const stepInfos = Object.values(run.state.stepInfos);
    const hasPending = stepInfos.some(
      (step) =>
        step.status === StepStatus.PENDING || step.status === StepStatus.RUNNING,
    );
    if (hasPending) {
      return;
    }

    const hasFailed = stepInfos.some(
      (step) => step.status === StepStatus.FAILED,
    );
    if (hasFailed) {
      await this.runService.endRun(
        organizationId,
        workflowRunId,
        WorkflowRunStatus.FAILED,
        'Workflow run failed',
      );
      return;
    }

    await this.runService.endRun(
      organizationId,
      workflowRunId,
      WorkflowRunStatus.COMPLETED,
    );
  }
}
