import { Injectable } from '@nestjs/common';
import { ObjectMetadataService, RecordService } from '@app/workspace';
import {
  RESUME_DELAYED_WORKFLOW_JOB_NAME,
} from '../constants/job-names';
import { DatabaseEventService } from '../events/database-event.service';
import { MessageQueue } from '../queue/message-queue.constants';
import { MessageQueueService } from '../queue/message-queue.service';
import type { WorkflowActionHandler, WorkflowActionInput } from './workflow-action.interface';
import { DatabaseEventAction, WorkflowActionType } from '../types/workflow.types';

@Injectable()
export class DelayWorkflowAction implements WorkflowActionHandler {
  constructor(private readonly queue: MessageQueueService) {}

  async execute({ currentStepId, runInfo, steps }: WorkflowActionInput) {
    const step = steps.find((candidate) => candidate.id === currentStepId);
    const input = (step?.settings?.input ?? {}) as {
      delayType?: 'DURATION' | 'SCHEDULED_DATE';
      duration?: {
        days?: number;
        hours?: number;
        minutes?: number;
        seconds?: number;
      };
      scheduledDateTime?: string;
    };

    let delayInMs = 0;
    if (input.delayType === 'SCHEDULED_DATE') {
      if (!input.scheduledDateTime) {
        return { error: 'Scheduled date time is required' };
      }
      delayInMs = new Date(input.scheduledDateTime).getTime() - Date.now();
      if (delayInMs < 0) {
        return { error: 'Scheduled date cannot be in the past' };
      }
    } else {
      const duration = input.duration ?? {};
      delayInMs =
        (Number(duration.days ?? 0) * 24 * 60 * 60 +
          Number(duration.hours ?? 0) * 60 * 60 +
          Number(duration.minutes ?? 0) * 60 +
          Number(duration.seconds ?? 0)) *
        1000;
    }

    await this.queue.add(
      MessageQueue.delayedJobsQueue,
      RESUME_DELAYED_WORKFLOW_JOB_NAME,
      {
        organizationId: runInfo.organizationId,
        workflowRunId: runInfo.workflowRunId,
        stepId: currentStepId,
      },
      {
        delay: delayInMs,
        jobId: `delay-${runInfo.workflowRunId}-${currentStepId}`,
      },
    );

    return { pendingEvent: true };
  }
}

@Injectable()
export class EmptyWorkflowAction implements WorkflowActionHandler {
  async execute({ currentStepId }: WorkflowActionInput) {
    return {
      result: {
        stepId: currentStepId,
        message: 'Step executed (no-op handler)',
      },
    };
  }
}

@Injectable()
export class CreateRecordWorkflowAction implements WorkflowActionHandler {
  constructor(
    private readonly records: RecordService,
    private readonly objects: ObjectMetadataService,
    private readonly databaseEvents: DatabaseEventService,
  ) {}

  async execute({ currentStepId, steps, runInfo }: WorkflowActionInput) {
    const step = steps.find((candidate) => candidate.id === currentStepId);
    const input = (step?.settings?.input ?? {}) as {
      objectId?: string;
      objectNameSingular?: string;
      fields?: Record<string, unknown>;
    };

    if (!input.objectId) {
      return { error: 'Create record is missing an object' };
    }

    const object = await this.objects.getById(
      runInfo.organizationId,
      input.objectId,
    );
    const record = await this.records.create(
      runInfo.organizationId,
      input.objectId,
      input.fields ?? {},
    );

    await this.databaseEvents.emitRecordEvent({
      organizationId: runInfo.organizationId,
      objectNameSingular: object.name_singular,
      action: DatabaseEventAction.CREATED,
      record: {
        id: record.id,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        ...record.fields,
      },
    });

    return {
      result: {
        recordId: record.id,
        objectId: object.id,
        objectNameSingular: object.name_singular,
        fields: record.fields,
      },
    };
  }
}

@Injectable()
export class UpdateRecordWorkflowAction implements WorkflowActionHandler {
  constructor(
    private readonly records: RecordService,
    private readonly objects: ObjectMetadataService,
    private readonly databaseEvents: DatabaseEventService,
  ) {}

  async execute({ currentStepId, steps, context, runInfo }: WorkflowActionInput) {
    const step = steps.find((candidate) => candidate.id === currentStepId);
    const input = (step?.settings?.input ?? {}) as {
      objectId?: string;
      objectNameSingular?: string;
      recordId?: string;
      fields?: Record<string, unknown>;
    };

    if (!input.objectId) {
      return { error: 'Update record is missing an object' };
    }

    const recordId = this.resolveRecordId(input, context);
    if (!recordId) {
      return {
        error:
          'Update record needs a record id from the trigger or a previous step',
      };
    }

    const object = await this.objects.getById(
      runInfo.organizationId,
      input.objectId,
    );
    const updated = await this.records.update(
      runInfo.organizationId,
      input.objectId,
      recordId,
      input.fields ?? {},
    );

    await this.databaseEvents.emitRecordEvent({
      organizationId: runInfo.organizationId,
      objectNameSingular: object.name_singular,
      action: DatabaseEventAction.UPDATED,
      record: {
        id: updated.after.id,
        createdAt: updated.after.createdAt,
        updatedAt: updated.after.updatedAt,
        ...updated.after.fields,
      },
      before: {
        id: updated.before.id,
        createdAt: updated.before.createdAt,
        updatedAt: updated.before.updatedAt,
        ...updated.before.fields,
      },
      updatedFields: updated.updatedFields,
    });

    return {
      result: {
        recordId: updated.after.id,
        objectId: object.id,
        objectNameSingular: object.name_singular,
        fields: updated.after.fields,
        updatedFields: updated.updatedFields,
      },
    };
  }

  private resolveRecordId(
    input: {
      objectId?: string;
      objectNameSingular?: string;
      recordId?: string;
    },
    context: Record<string, unknown>,
  ): string | undefined {
    if (typeof input.recordId === 'string' && input.recordId.trim()) {
      return input.recordId.trim();
    }

    const trigger = context.trigger as
      | {
          objectNameSingular?: string;
          properties?: {
            after?: { id?: unknown } | null;
            before?: { id?: unknown } | null;
          };
        }
      | undefined;
    const triggerRecordId = this.readId(
      trigger?.properties?.after?.id ?? trigger?.properties?.before?.id,
    );
    const triggerMatchesObject =
      Boolean(input.objectNameSingular) &&
      trigger?.objectNameSingular === input.objectNameSingular;

    if (triggerRecordId && (triggerMatchesObject || !input.objectNameSingular)) {
      return triggerRecordId;
    }

    for (const [key, value] of Object.entries(context)) {
      if (key === 'trigger' || !value || typeof value !== 'object') {
        continue;
      }
      const result = value as {
        recordId?: unknown;
        objectId?: unknown;
        objectNameSingular?: unknown;
      };
      const previousId = this.readId(result.recordId);
      if (!previousId) continue;
      if (input.objectId && result.objectId === input.objectId) {
        return previousId;
      }
      if (
        input.objectNameSingular &&
        result.objectNameSingular === input.objectNameSingular
      ) {
        return previousId;
      }
    }

    return undefined;
  }

  private readId(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }
}

@Injectable()
export class WorkflowActionFactory {
  constructor(
    private readonly delayAction: DelayWorkflowAction,
    private readonly createRecordAction: CreateRecordWorkflowAction,
    private readonly updateRecordAction: UpdateRecordWorkflowAction,
    private readonly emptyAction: EmptyWorkflowAction,
  ) {}

  get(type: string): WorkflowActionHandler {
    switch (type) {
      case WorkflowActionType.DELAY:
        return this.delayAction;
      case WorkflowActionType.CREATE_RECORD:
        return this.createRecordAction;
      case WorkflowActionType.UPDATE_RECORD:
        return this.updateRecordAction;
      default:
        return this.emptyAction;
    }
  }
}
