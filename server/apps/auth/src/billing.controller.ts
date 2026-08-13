import { Controller, Get, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { BillingService } from './billing.service';

@Controller('api/billing')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Post('sync')
  sync(
    @Req() req: Request,
    @Query('organizationId') organizationId: string,
  ) {
    return this.billing.syncSubscriptions(req.headers, organizationId);
  }

  @Get('invoices')
  listInvoices(
    @Req() req: Request,
    @Query('organizationId') organizationId: string,
  ) {
    return this.billing.listInvoices(req.headers, organizationId);
  }

  @Get('payments')
  listPayments(
    @Req() req: Request,
    @Query('organizationId') organizationId: string,
  ) {
    return this.billing.listPayments(req.headers, organizationId);
  }
}
