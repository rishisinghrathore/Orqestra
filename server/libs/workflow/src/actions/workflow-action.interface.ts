import type { WorkflowActionOutput } from '../types/workflow.types';

export type WorkflowActionInput = {
  currentStepId: string;
  steps: import('../types/workflow.types').WorkflowAction[];
  context: Record<string, unknown>;
  runInfo: {
    workflowRunId: string;
    organizationId: string;
  };
};

export interface WorkflowActionHandler {
  execute(input: WorkflowActionInput): Promise<WorkflowActionOutput>;
}
