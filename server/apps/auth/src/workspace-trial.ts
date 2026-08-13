import { randomUUID } from 'node:crypto';
import type { Pool } from 'pg';
import type Stripe from 'stripe';
import {
  TRIAL_DAYS,
  TRIAL_PLAN_NAME,
  TRIAL_PRICE_ID,
  TRIAL_SEATS,
} from './subscription-plans';

type ProvisionInput = {
  stripe: Stripe;
  pool: Pool;
  organization: {
    id: string;
    name: string;
    stripeCustomerId?: string | null;
  };
  user: {
    id: string;
    email: string;
    name?: string | null;
  };
};

/**
 * Assigns a 7-day workspace trial (2 seats, 1 GB, 2 projects).
 * Cancels automatically at trial end if no payment method / upgrade.
 */
export async function provisionWorkspaceTrial({
  stripe,
  pool,
  organization,
  user,
}: ProvisionInput) {
  const existing = await pool.query(
    `SELECT id FROM subscription
     WHERE "referenceId" = $1
       AND status IN ('trialing', 'active', 'incomplete')
     LIMIT 1`,
    [organization.id],
  );

  if (existing.rowCount && existing.rowCount > 0) {
    return;
  }

  let customerId = organization.stripeCustomerId ?? null;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: organization.name,
      metadata: {
        organizationId: organization.id,
        customerType: 'organization',
        userId: user.id,
      },
    });
    customerId = customer.id;

    await pool.query(
      `UPDATE organization SET "stripeCustomerId" = $1 WHERE id = $2`,
      [customerId, organization.id],
    );
  } else {
    await stripe.customers.update(customerId, {
      email: user.email,
    });
  }

  const stripeSubscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: TRIAL_PRICE_ID }],
    trial_period_days: TRIAL_DAYS,
    trial_settings: {
      end_behavior: {
        missing_payment_method: 'cancel',
      },
    },
    metadata: {
      referenceId: organization.id,
      plan: TRIAL_PLAN_NAME,
      userId: user.id,
      customerType: 'organization',
    },
  });

  const item = stripeSubscription.items.data[0];
  const periodStartUnix =
    item?.current_period_start ??
    stripeSubscription.trial_start ??
    Math.floor(Date.now() / 1000);
  const periodEndUnix =
    item?.current_period_end ??
    stripeSubscription.trial_end ??
    periodStartUnix + TRIAL_DAYS * 24 * 60 * 60;

  await pool.query(
    `INSERT INTO subscription (
      id,
      plan,
      "referenceId",
      "stripeCustomerId",
      "stripeSubscriptionId",
      status,
      "periodStart",
      "periodEnd",
      "trialStart",
      "trialEnd",
      seats,
      "billingInterval",
      "cancelAtPeriodEnd"
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
    )`,
    [
      randomUUID(),
      TRIAL_PLAN_NAME,
      organization.id,
      customerId,
      stripeSubscription.id,
      stripeSubscription.status,
      new Date(periodStartUnix * 1000),
      new Date(periodEndUnix * 1000),
      stripeSubscription.trial_start
        ? new Date(stripeSubscription.trial_start * 1000)
        : null,
      stripeSubscription.trial_end
        ? new Date(stripeSubscription.trial_end * 1000)
        : null,
      TRIAL_SEATS,
      item?.price.recurring?.interval ?? 'month',
      false,
    ],
  );
}
