import type { WorkflowRunStepInfos } from '../types/workflow.types';

export const getWorkflowRunContext = (
  stepInfos: WorkflowRunStepInfos,
): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(stepInfos)
      .filter(([, value]) => value?.result !== undefined)
      .map(([key, value]) => [key, value.result]),
  );
