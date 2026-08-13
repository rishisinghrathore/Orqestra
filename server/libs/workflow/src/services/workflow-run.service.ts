import { Injectable } from '@nestjs/common';
import {
  StepStatus,
  WorkflowRunStatus,
  type WorkflowAction,
  type WorkflowRunState,
  type WorkflowRunStepInfo,
  type WorkflowTrigger,
} from '../types/workflow.types';
import { TRIGGER_STEP_ID } from '../constants/job-names';
import { WorkflowRepository } from '../repositories/workflow.repository';

@Injectable()
export class WorkflowRunService {
  constructor(private readonly repo: WorkflowRepository) {}

  buildInitState(
    trigger: WorkflowTrigger,
    steps: WorkflowAction[],
    triggerPayload: object,
    error?: string,
  ): WorkflowRunState {
    return {
      flow: { trigger, steps },
      stepInfos: {
        [TRIGGER_STEP_ID]: {
          status: StepStatus.NOT_STARTED,
          result: triggerPayload,
        },
        ...Object.fromEntries(
          steps.map((step) => [step.id, { status: StepStatus.NOT_STARTED }]),
        ),
      },
      workflowRunError: error,
    };
  }

  async getRunOrFail(organizationId: string, runId: string) {
    const run = await this.repo.getRun(organizationId, runId);
    if (!run) {
      throw new Error('Workflow run not found');
    }
    return run;
  }

  async startRun(organizationId: string, runId: string) {
    const run = await this.getRunOrFail(organizationId, runId);
    const stepInfos = { ...run.state.stepInfos };
    stepInfos[TRIGGER_STEP_ID] = {
      ...stepInfos[TRIGGER_STEP_ID],
      status: StepStatus.SUCCESS,
      result: stepInfos[TRIGGER_STEP_ID]?.result ?? {},
    };

    return this.repo.updateRun(organizationId, runId, {
      status: WorkflowRunStatus.RUNNING,
      started_at: new Date(),
      state: {
        ...run.state,
        stepInfos,
      },
    });
  }

  async endRun(
    organizationId: string,
    runId: string,
    status: WorkflowRunStatus.COMPLETED | WorkflowRunStatus.FAILED,
    error?: string,
  ) {
    const run = await this.getRunOrFail(organizationId, runId);
    const stepInfos = Object.fromEntries(
      Object.entries(run.state.stepInfos).map(([stepId, step]) => {
        if (
          step.status === StepStatus.RUNNING ||
          step.status === StepStatus.PENDING
        ) {
          return [
            stepId,
            {
              ...step,
              status: StepStatus.FAILED,
              error: 'Workflow ended before this step completed',
            },
          ];
        }
        return [stepId, step];
      }),
    ) as Record<string, WorkflowRunStepInfo>;

    return this.repo.updateRun(organizationId, runId, {
      status,
      ended_at: new Date(),
      state: {
        ...run.state,
        stepInfos,
        workflowRunError: error,
      },
    });
  }

  async updateStepInfo(
    organizationId: string,
    runId: string,
    stepId: string,
    stepInfo: WorkflowRunStepInfo,
  ) {
    const run = await this.getRunOrFail(organizationId, runId);
    return this.repo.updateRun(organizationId, runId, {
      state: {
        ...run.state,
        stepInfos: {
          ...run.state.stepInfos,
          [stepId]: {
            ...run.state.stepInfos[stepId],
            ...stepInfo,
          },
        },
      },
    });
  }
}
