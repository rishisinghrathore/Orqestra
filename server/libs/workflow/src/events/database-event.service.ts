import { Injectable, Logger } from '@nestjs/common';
import {
  RESUME_DELAYED_WORKFLOW_JOB_NAME,
  WORKFLOW_TRIGGER_JOB_NAME,
} from '../constants/job-names';
import { MessageQueue } from '../queue/message-queue.constants';
import { MessageQueueService } from '../queue/message-queue.service';
import { WorkflowRepository } from '../repositories/workflow.repository';
import {
  DatabaseEventAction,
  type DatabaseEventPayload,
} from '../types/workflow.types';

export type DatabaseEventBatch = {
  organizationId: string;
  eventName: string;
  events: DatabaseEventPayload[];
};

@Injectable()
export class DatabaseEventService {
  private readonly logger = new Logger(DatabaseEventService.name);

  constructor(
    private readonly repo: WorkflowRepository,
    private readonly queue: MessageQueueService,
  ) {}

  async emitBatch(batch: DatabaseEventBatch) {
    const triggers = await this.repo.listAutomatedTriggersByEvent(
      batch.organizationId,
      batch.eventName,
    );

    if (triggers.length === 0) {
      return;
    }

    for (const trigger of triggers) {
      const watchedFields = (trigger.settings.fields as string[] | undefined) ?? [];

      for (const payload of batch.events) {
        if (!this.matchesWatchedFields(payload, watchedFields)) {
          continue;
        }

        await this.queue.add(
          MessageQueue.workflowQueue,
          WORKFLOW_TRIGGER_JOB_NAME,
          {
            organizationId: batch.organizationId,
            workflowId: trigger.workflow_id,
            payload,
          },
          {
            jobId: `trigger-${trigger.workflow_id}-${payload.properties.after?.id ?? payload.properties.before?.id ?? Date.now()}`,
          },
        );
      }
    }
  }

  async emitRecordEvent(input: {
    organizationId: string;
    objectNameSingular: string;
    action: DatabaseEventAction;
    record: Record<string, unknown>;
    before?: Record<string, unknown> | null;
    updatedFields?: string[];
  }) {
    const eventName = `${input.objectNameSingular}.${input.action}`;
    const payload: DatabaseEventPayload = {
      name: eventName,
      objectNameSingular: input.objectNameSingular,
      action: input.action,
      properties: {
        before: input.before ?? null,
        after:
          input.action === DatabaseEventAction.DELETED ? null : input.record,
        updatedFields: input.updatedFields,
      },
    };

    await this.emitBatch({
      organizationId: input.organizationId,
      eventName,
      events: [payload],
    });
  }

  private matchesWatchedFields(
    payload: DatabaseEventPayload,
    watchedFields: string[],
  ) {
    if (
      payload.action !== DatabaseEventAction.UPDATED &&
      payload.action !== DatabaseEventAction.UPSERTED
    ) {
      return true;
    }

    if (watchedFields.length === 0) {
      return true;
    }

    const updatedFields = payload.properties.updatedFields ?? [];
    return watchedFields.some((field) => updatedFields.includes(field));
  }
}
