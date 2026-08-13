import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { fromNodeHeaders } from 'better-auth/node';
import { randomUUID } from 'node:crypto';
import type { IncomingHttpHeaders } from 'node:http';
import { Pool } from 'pg';
import Stripe from 'stripe';
import { AUTH, type Auth } from './auth';
import { subscriptionPlans } from './subscription-plans';

type OrgWithStripe = {
  id: string;
  name: string;
  stripeCustomerId?: string | null;
};

@Injectable()
export class BillingService {
  private readonly stripe: Stripe;
  private readonly pool: Pool;

  constructor(
    @Inject(AUTH) private readonly auth: Auth,
    config: ConfigService,
  ) {
    this.stripe = new Stripe(config.getOrThrow<string>('STRIPE_SECRET_KEY'), {
      apiVersion: '2026-07-29.dahlia',
    });
    this.pool = new Pool({
      connectionString: config.get<string>(
        'DATABASE_URL',
        'postgresql://postgres:postgres@localhost:5432/agentic',
      ),
    });
  }

  private async requireOrgCustomer(
    headers: IncomingHttpHeaders,
    organizationId: string,
  ) {
    if (!organizationId) {
      throw new BadRequestException('organizationId is required');
    }

    const session = await this.auth.api.getSession({
      headers: fromNodeHeaders(headers),
    });

    if (!session?.user) {
      throw new UnauthorizedException('Not authenticated');
    }

    const nodeHeaders = fromNodeHeaders(headers);
    const org = (await this.auth.api.getFullOrganization({
      query: { organizationId },
      headers: nodeHeaders,
    })) as OrgWithStripe | null;

    if (!org) {
      throw new ForbiddenException('Organization not found or access denied');
    }

    let customerId = org.stripeCustomerId ?? null;

    if (!customerId) {
      const subscriptions = await this.auth.api.listActiveSubscriptions({
        query: {
          referenceId: organizationId,
          customerType: 'organization',
        },
        headers: nodeHeaders,
      });

      const withCustomer = (
        Array.isArray(subscriptions) ? subscriptions : []
      ).find(
        (sub: { stripeCustomerId?: string | null }) => sub.stripeCustomerId,
      );

      customerId = withCustomer?.stripeCustomerId ?? null;
    }

    return {
      organization: org,
      customerId,
    };
  }

  private resolvePlanName(priceId: string | undefined) {
    if (!priceId) return null;
    const plan = subscriptionPlans.find(
      (p) =>
        p.priceId === priceId ||
        p.annualDiscountPriceId === priceId,
    );
    return plan?.name.toLowerCase() ?? null;
  }

  /**
   * Pull live Stripe subscription state into the local DB.
   * Needed when portal/checkout upgrades complete before webhooks update us.
   */
  async syncSubscriptions(
    headers: IncomingHttpHeaders,
    organizationId: string,
  ) {
    const { organization, customerId } = await this.requireOrgCustomer(
      headers,
      organizationId,
    );

    if (!customerId) {
      return { synced: 0 };
    }

    if (!organization.stripeCustomerId) {
      await this.pool.query(
        `UPDATE organization SET "stripeCustomerId" = $1 WHERE id = $2`,
        [customerId, organizationId],
      );
    }

    const result = await this.stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 20,
    });

    let synced = 0;

    for (const stripeSub of result.data) {
      if (
        !['active', 'trialing', 'past_due', 'canceled', 'unpaid'].includes(
          stripeSub.status,
        )
      ) {
        continue;
      }

      const item = stripeSub.items.data[0];
      const priceId = item?.price.id;
      const planName = this.resolvePlanName(priceId);
      if (!planName) continue;

      const plan = subscriptionPlans.find(
        (p) => p.name.toLowerCase() === planName,
      );
      const seats =
        (plan?.limits as { seats?: number } | undefined)?.seats ??
        item?.quantity ??
        1;

      const periodStartUnix =
        item?.current_period_start ?? stripeSub.trial_start ?? null;
      const periodEndUnix =
        item?.current_period_end ?? stripeSub.trial_end ?? null;

      const existing = await this.pool.query<{ id: string }>(
        `SELECT id FROM subscription WHERE "stripeSubscriptionId" = $1 LIMIT 1`,
        [stripeSub.id],
      );

      const values = [
        planName,
        organizationId,
        customerId,
        stripeSub.id,
        stripeSub.status,
        periodStartUnix ? new Date(periodStartUnix * 1000) : null,
        periodEndUnix ? new Date(periodEndUnix * 1000) : null,
        stripeSub.trial_start
          ? new Date(stripeSub.trial_start * 1000)
          : null,
        stripeSub.trial_end ? new Date(stripeSub.trial_end * 1000) : null,
        seats,
        item?.price.recurring?.interval ?? 'month',
        stripeSub.cancel_at_period_end ?? false,
        stripeSub.cancel_at ? new Date(stripeSub.cancel_at * 1000) : null,
        stripeSub.canceled_at
          ? new Date(stripeSub.canceled_at * 1000)
          : null,
        stripeSub.ended_at ? new Date(stripeSub.ended_at * 1000) : null,
      ];

      if (existing.rows[0]) {
        await this.pool.query(
          `UPDATE subscription SET
            plan = $1,
            "referenceId" = $2,
            "stripeCustomerId" = $3,
            "stripeSubscriptionId" = $4,
            status = $5,
            "periodStart" = $6,
            "periodEnd" = $7,
            "trialStart" = $8,
            "trialEnd" = $9,
            seats = $10,
            "billingInterval" = $11,
            "cancelAtPeriodEnd" = $12,
            "cancelAt" = $13,
            "canceledAt" = $14,
            "endedAt" = $15
          WHERE id = $16`,
          [...values, existing.rows[0].id],
        );
      } else {
        await this.pool.query(
          `INSERT INTO subscription (
            id, plan, "referenceId", "stripeCustomerId", "stripeSubscriptionId",
            status, "periodStart", "periodEnd", "trialStart", "trialEnd",
            seats, "billingInterval", "cancelAtPeriodEnd", "cancelAt",
            "canceledAt", "endedAt"
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
          )`,
          [randomUUID(), ...values],
        );
      }

      synced += 1;
    }

    return { synced };
  }

  async listInvoices(headers: IncomingHttpHeaders, organizationId: string) {
    const { customerId } = await this.requireOrgCustomer(
      headers,
      organizationId,
    );

    if (!customerId) {
      return { invoices: [] };
    }

    const result = await this.stripe.invoices.list({
      customer: customerId,
      limit: 50,
    });

    return {
      invoices: result.data.map((invoice) => ({
        id: invoice.id,
        number: invoice.number,
        status: invoice.status,
        currency: invoice.currency,
        amountDue: invoice.amount_due,
        amountPaid: invoice.amount_paid,
        created: invoice.created,
        periodStart: invoice.period_start,
        periodEnd: invoice.period_end,
        hostedInvoiceUrl: invoice.hosted_invoice_url,
        invoicePdf: invoice.invoice_pdf,
        description:
          invoice.description ??
          invoice.lines.data[0]?.description ??
          null,
      })),
    };
  }

  async listPayments(headers: IncomingHttpHeaders, organizationId: string) {
    const { customerId } = await this.requireOrgCustomer(
      headers,
      organizationId,
    );

    if (!customerId) {
      return { payments: [] };
    }

    const result = await this.stripe.charges.list({
      customer: customerId,
      limit: 50,
    });

    return {
      payments: result.data.map((charge) => ({
        id: charge.id,
        status: charge.status,
        paid: charge.paid,
        refunded: charge.refunded,
        currency: charge.currency,
        amount: charge.amount,
        amountRefunded: charge.amount_refunded,
        created: charge.created,
        description: charge.description,
        receiptUrl: charge.receipt_url,
        paymentMethod:
          charge.payment_method_details?.type ??
          charge.payment_method ??
          null,
        cardBrand: charge.payment_method_details?.card?.brand ?? null,
        cardLast4: charge.payment_method_details?.card?.last4 ?? null,
      })),
    };
  }
}
