import 'dotenv/config';
import { betterAuth } from 'better-auth';
import { organization, twoFactor } from 'better-auth/plugins';
import { apiKey } from '@better-auth/api-key';
import { Pool } from 'pg';
import { ac, roles } from './permissions';
import { createStripePlugin } from './stripe';

/** CLI-only Better Auth instance for `npx @better-auth/cli migrate`. */
export const auth = betterAuth({
  appName: 'Elasticware',
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3001',
  secret: process.env.BETTER_AUTH_SECRET,
  database: new Pool({
    connectionString:
      process.env.DATABASE_URL ??
      'postgresql://postgres:postgres@localhost:5432/agentic',
  }),
  plugins: [
    organization({
      allowUserToCreateOrganization: true,
      ac,
      roles,
      dynamicAccessControl: {
        enabled: true,
        maximumRolesPerOrganization: 50,
      },
    }),
    apiKey([
      {
        configId: 'org-keys',
        defaultPrefix: 'elw_',
        references: 'organization',
      },
    ]),
    twoFactor({
      issuer: 'Elasticware',
      totpOptions: {
        digits: 6,
        period: 30,
      },
      backupCodeOptions: {
        amount: 10,
        length: 10,
        storeBackupCodes: 'encrypted',
      },
    }),
    createStripePlugin({
      secretKey: process.env.STRIPE_SECRET_KEY ?? 'sk_test_placeholder',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? 'whsec_placeholder',
    }),
  ],
  emailAndPassword: {
    enabled: true,
  },
});
