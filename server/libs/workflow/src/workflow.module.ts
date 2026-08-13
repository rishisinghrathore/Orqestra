import { Global, Module } from '@nestjs/common';
import { WorkspaceModule } from '@app/workspace';
import {
  CreateRecordWorkflowAction,
  DelayWorkflowAction,
  EmptyWorkflowAction,
  UpdateRecordWorkflowAction,
  WorkflowActionFactory,
} from './actions/workflow-actions';
import { DatabaseEventService } from './events/database-event.service';
import {
  ResumeDelayedWorkflowJobHandler,
  RunWorkflowJobHandler,
  WorkflowJobRegistrar,
  WorkflowTriggerJobHandler,
} from './jobs/workflow-jobs';
import { MessageQueueModule } from './queue/message-queue.module';
import { WorkflowRepository } from './repositories/workflow.repository';
import { WorkflowExecutorService } from './services/workflow-executor.service';
import { WorkflowRunService } from './services/workflow-run.service';
import {
  WorkflowRunnerService,
  WorkflowService,
} from './services/workflow.service';

@Global()
@Module({
  imports: [WorkspaceModule, MessageQueueModule],
  providers: [
    WorkflowRepository,
    WorkflowRunService,
    WorkflowRunnerService,
    WorkflowService,
    WorkflowExecutorService,
    DelayWorkflowAction,
    CreateRecordWorkflowAction,
    UpdateRecordWorkflowAction,
    EmptyWorkflowAction,
    WorkflowActionFactory,
    WorkflowTriggerJobHandler,
    RunWorkflowJobHandler,
    ResumeDelayedWorkflowJobHandler,
    WorkflowJobRegistrar,
    DatabaseEventService,
  ],
  exports: [
    WorkflowService,
    WorkflowRunnerService,
    WorkflowRunService,
    DatabaseEventService,
    WorkflowRepository,
  ],
})
export class WorkflowModule {}
