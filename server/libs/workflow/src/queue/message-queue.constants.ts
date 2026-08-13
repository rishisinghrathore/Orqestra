export enum MessageQueue {
  workflowQueue = 'workflowQueue',
  delayedJobsQueue = 'delayedJobsQueue',
}

export type JobOptions = {
  delay?: number;
  jobId?: string;
  attempts?: number;
};

export type JobHandler<T = unknown> = (data: T) => Promise<void>;

export const MESSAGE_QUEUE = Symbol('MESSAGE_QUEUE');
