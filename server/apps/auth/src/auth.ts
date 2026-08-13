import { betterAuth } from 'better-auth';
import { organization, twoFactor } from 'better-auth/plugins';
import { apiKey } from '@better-auth/api-key';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import Stripe from 'stripe';
import { ac, roles } from './permissions';
import { createStripePlugin } from './stripe';
import { provisionWorkspaceSchema } from './workspace-schema/provision-workspace-schema';
import { provisionWorkspaceTrial } from './workspace-trial';

/**
 * Better Auth does not ship a Sequelize adapter.
 * Use a Postgres connection pool against the same database
 * your Sequelize models use (via DATABASE_URL).
 */
export const createAuth = (config: ConfigService) => {
  const pool = new Pool({
    connectionString: config.get<string>(
      'DATABASE_URL',
      'postgresql://postgres:postgres@localhost:5432/agentic',
    ),
  });

  const stripeClient = new Stripe(
    config.getOrThrow<string>('STRIPE_SECRET_KEY'),
    { apiVersion: '2026-07-29.dahlia' },
  );

  return betterAuth({
    appName: 'Elasticware',
    baseURL: config.get<string>('BETTER_AUTH_URL', 'http://localhost:3001'),
    secret: config.getOrThrow<string>('BETTER_AUTH_SECRET'),
    database: pool,
    trustedOrigins: [
      config.get<string>('CLIENT_ORIGIN', 'http://localhost:5173'),
    ],
    socialProviders: {
      google: {
        clientId: config.getOrThrow<string>('GOOGLE_CLIENT_ID'),
        clientSecret: config.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
        prompt: 'select_account',
      },
    },
    plugins: [
      organization({
        allowUserToCreateOrganization: true,
        ac,
        roles,
        dynamicAccessControl: {
          enabled: true,
          maximumRolesPerOrganization: 50,
        },
        organizationHooks: {
          afterCreateOrganization: async ({ organization: org, user }) => {
            try {
              await provisionWorkspaceSchema({
                pool,
                organizationId: org.id,
              });
            } catch (error) {
              console.error('Failed to provision workspace schema', error);
            }

            try {
              await provisionWorkspaceTrial({
                stripe: stripeClient,
                pool,
                organization: org,
                user,
              });
            } catch (error) {
              console.error('Failed to provision workspace trial', error);
            }
          },
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
        stripeClient,
        webhookSecret: config.get<string>(
          'STRIPE_WEBHOOK_SECRET',
          'whsec_placeholder',
        ),
      }),
    ],
    emailAndPassword: {
      enabled: true,
    },
  });
};

export type Auth = ReturnType<typeof createAuth>;

export const AUTH = Symbol('AUTH');
