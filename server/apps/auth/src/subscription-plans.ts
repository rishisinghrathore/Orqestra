import type { StripePlan } from '@better-auth/stripe';

export const TRIAL_PLAN_NAME = 'trial';
export const TRIAL_PRICE_ID = 'price_1U22SBIdsVhiGIqSGvn80ecg';
export const TRIAL_DAYS = 7;
export const TRIAL_SEATS = 2;

/** Stripe test-mode prices for Elasticware. */
export const subscriptionPlans: StripePlan[] = [
  {
    name: TRIAL_PLAN_NAME,
    priceId: TRIAL_PRICE_ID,
    prorationBehavior: 'none',
    limits: {
      projects: 2,
      storage: 1,
      seats: TRIAL_SEATS,
    },
    freeTrial: {
      days: TRIAL_DAYS,
    },
  },
  {
    name: 'basic',
    priceId: 'price_1U1ndpIdsVhiGIqSFRSSBIsc',
    annualDiscountPriceId: 'price_1U1ndqIdsVhiGIqSadOYd5qX',
    prorationBehavior: 'always_invoice',
    limits: {
      projects: 5,
      storage: 10,
      seats: 10,
    },
  },
  {
    name: 'pro',
    priceId: 'price_1U1ndpIdsVhiGIqSqTtlqjTi',
    annualDiscountPriceId: 'price_1U1ndrIdsVhiGIqSdVrCaVsf',
    prorationBehavior: 'always_invoice',
    limits: {
      projects: 20,
      storage: 50,
      seats: 20,
    },
  },
];
