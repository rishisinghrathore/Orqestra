export enum WorkflowRunStatus {
  NOT_STARTED = 'NOT_STARTED',
  ENQUEUED = 'ENQUEUED',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  STOPPED = 'STOPPED',
}

export enum WorkflowVersionStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  DEACTIVATED = 'DEACTIVATED',
  ARCHIVED = 'ARCHIVED',
}

export enum StepStatus {
  NOT_STARTED = 'NOT_STARTED',
  RUNNING = 'RUNNING',
  SUCCESS = 'SUCCESS',
  PENDING = 'PENDING',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED',
  STOPPED = 'STOPPED',
}

export enum WorkflowTriggerType {
  DATABASE_EVENT = 'DATABASE_EVENT',
  MANUAL = 'MANUAL',
  CRON = 'CRON',
  WEBHOOK = 'WEBHOOK',
}

export enum WorkflowActionType {
  DELAY = 'DELAY',
  CREATE_RECORD = 'CREATE_RECORD',
  UPDATE_RECORD = 'UPDATE_RECORD',
  DELETE_RECORD = 'DELETE_RECORD',
  FIND_RECORDS = 'FIND_RECORDS',
  FILTER = 'FILTER',
  EMPTY = 'EMPTY',
}

export enum AutomatedTriggerType {
  DATABASE_EVENT = 'DATABASE_EVENT',
  CRON = 'CRON',
}

export enum DatabaseEventAction {
  CREATED = 'created',
  UPDATED = 'updated',
  DELETED = 'deleted',
  UPSERTED = 'upserted',
}

export type WorkflowRunStepInfo = {
  status: StepStatus;
  result?: unknown;
  error?: string;
};

export type WorkflowRunStepInfos = Record<string, WorkflowRunStepInfo>;

export type WorkflowTrigger = {
  type: WorkflowTriggerType;
  settings: Record<string, unknown>;
  nextStepIds?: string[];
};

export type WorkflowAction = {
  id: string;
  type: WorkflowActionType | string;
  name: string;
  settings: Record<string, unknown>;
  nextStepIds?: string[];
};

export type WorkflowRunState = {
  flow: {
    trigger: WorkflowTrigger;
    steps: WorkflowAction[];
  };
  stepInfos: WorkflowRunStepInfos;
  workflowRunError?: string;
};

export type WorkflowActionOutput = {
  result?: unknown;
  error?: string;
  pendingEvent?: boolean;
  shouldSkipStepExecution?: boolean;
  shouldEndWorkflowRun?: boolean;
};

export type DatabaseEventPayload = {
  name: string;
  objectNameSingular: string;
  action: DatabaseEventAction;
  properties: {
    before?: Record<string, unknown> | null;
    after?: Record<string, unknown> | null;
    updatedFields?: string[];
  };
};

export type WorkflowRow = {
  id: string;
  name: string | null;
  last_published_version_id: string | null;
  statuses: string[] | null;
  position: number;
  created_at: Date;
  updated_at: Date;
};

export type WorkflowVersionRow = {
  id: string;
  name: string | null;
  trigger: WorkflowTrigger | null;
  steps: WorkflowAction[] | null;
  status: WorkflowVersionStatus;
  workflow_id: string;
  position: number;
  created_at: Date;
  updated_at: Date;
};

export type WorkflowRunRow = {
  id: string;
  name: string | null;
  status: WorkflowRunStatus;
  enqueued_at: Date | null;
  started_at: Date | null;
  ended_at: Date | null;
  state: WorkflowRunState;
  step_logs: unknown | null;
  workflow_id: string;
  workflow_version_id: string | null;
  created_at: Date;
  updated_at: Date;
};

export type WorkflowAutomatedTriggerRow = {
  id: string;
  type: AutomatedTriggerType;
  settings: Record<string, unknown>;
  workflow_id: string;
  created_at: Date;
  updated_at: Date;
};
