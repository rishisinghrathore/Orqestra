import { createAccessControl } from 'better-auth/plugins/access';
import {
  adminAc,
  defaultStatements,
  memberAc,
  ownerAc,
} from 'better-auth/plugins/organization/access';

/**
 * CRM modules (nav): Deals, Leads, Contacts, Companies, Emails, Calls, Meetings.
 * Keep in sync with `client/src/lib/permissions.ts`.
 */
const crmActions = ['create', 'read', 'update', 'delete', 'manage'] as const;

export const statement = {
  ...defaultStatements,
  deal: crmActions,
  lead: crmActions,
  contact: crmActions,
  company: crmActions,
  email: crmActions,
  call: crmActions,
  meeting: crmActions,
} as const;

export const ac = createAccessControl(statement);

const crmFull = {
  deal: ['create', 'read', 'update', 'delete', 'manage'],
  lead: ['create', 'read', 'update', 'delete', 'manage'],
  contact: ['create', 'read', 'update', 'delete', 'manage'],
  company: ['create', 'read', 'update', 'delete', 'manage'],
  email: ['create', 'read', 'update', 'delete', 'manage'],
  call: ['create', 'read', 'update', 'delete', 'manage'],
  meeting: ['create', 'read', 'update', 'delete', 'manage'],
} as const;

const crmCrud = {
  deal: ['create', 'read', 'update', 'delete'],
  lead: ['create', 'read', 'update', 'delete'],
  contact: ['create', 'read', 'update', 'delete'],
  company: ['create', 'read', 'update', 'delete'],
  email: ['create', 'read', 'update', 'delete'],
  call: ['create', 'read', 'update', 'delete'],
  meeting: ['create', 'read', 'update', 'delete'],
} as const;

const crmRead = {
  deal: ['read'],
  lead: ['read'],
  contact: ['read'],
  company: ['read'],
  email: ['read'],
  call: ['read'],
  meeting: ['read'],
} as const;

/** Full CRM + org ownership (includes `ac` so owners can manage dynamic roles). */
export const owner = ac.newRole({
  ...crmFull,
  ...ownerAc.statements,
});

/**
 * CRM CRUD (no `manage`) + org admin.
 * Includes `ac: create|read|update|delete` so admins can create org roles at runtime.
 */
export const admin = ac.newRole({
  ...crmCrud,
  ...adminAc.statements,
});

/** Read-only CRM + default member org permissions. */
export const member = ac.newRole({
  ...crmRead,
  ...memberAc.statements,
});

export const roles = { owner, admin, member } as const;
