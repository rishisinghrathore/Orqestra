import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { WorkflowService } from '@app/workflow';

@Controller('webhooks')
export class WorkflowWebhookController {
  constructor(private readonly workflows: WorkflowService) {}

  @Post('workflows/:organizationId/:workflowId')
  async runWorkflowByPostRequest(
    @Param('organizationId') organizationId: string,
    @Param('workflowId') workflowId: string,
    @Body() body: unknown,
    @Req() request: Request,
  ) {
    return this.workflows.triggerWebhook(
      organizationId,
      workflowId,
      asWebhookPayload(body ?? request.body),
    );
  }

  @Get('workflows/:organizationId/:workflowId')
  async runWorkflowByGetRequest(
    @Param('organizationId') organizationId: string,
    @Param('workflowId') workflowId: string,
  ) {
    return this.workflows.triggerWebhook(organizationId, workflowId, {});
  }
}

const asWebhookPayload = (value: unknown): object => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as object;
  }
  return {};
};
