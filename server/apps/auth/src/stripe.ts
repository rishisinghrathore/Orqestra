import { stripe, type StripeOptions } from '@better-auth/stripe';
import Stripe from 'stripe';
import { subscriptionPlans } from './subscription-plans';

type MemberRow = {
  role?: string | null;
};

type CreateStripePluginOptions = {
  webhookSecret: string;
} & (
  | { stripeClient: Stripe; secretKey?: never }
  | { secretKey: string; stripeClient?: never }
);

export const createStripePlugin = (options: CreateStripePluginOptions) => {
  const stripeClient =
    options.stripeClient ??
    new Stripe(options.secretKey!, {
      apiVersion: '2026-07-29.dahlia',
    });

  return stripe({
    stripeClient: stripeClient as unknown as StripeOptions['stripeClient'],
    stripeWebhookSecret: options.webhookSecret,
    createCustomerOnSignUp: true,
    organization: {
      enabled: true,
      getCustomerCreateParams: async (_organization, ctx) => {
        const email = ctx.context.session?.user?.email;
        return email ? { email } : {};
      },
    },
    subscription: {
      enabled: true,
      plans: subscriptionPlans,
      getCheckoutSessionParams: async ({ user, subscription }) => {
        const customerId = subscription.stripeCustomerId;
        if (customerId && user.email) {
          await stripeClient.customers.update(customerId, {
            email: user.email,
          });
        }
        return {};
      },
      authorizeReference: async ({ user, referenceId, action }, ctx) => {
        if (referenceId === user.id) {
          return true;
        }

        const member = (await ctx.context.adapter.findOne({
          model: 'member',
          where: [
            { field: 'organizationId', value: referenceId },
            { field: 'userId', value: user.id },
          ],
        })) as MemberRow | null;

        if (!member) {
          return false;
        }

        if (action === 'list-subscription') {
          return true;
        }

        return member.role === 'owner' || member.role === 'admin';
      },
    },
  });
};
