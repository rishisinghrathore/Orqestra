import { createAccessControl } from "better-auth/plugins/access"
import {
  adminAc,
  defaultStatements,
  memberAc,
  ownerAc,
} from "better-auth/plugins/organization/access"

/**
 * CRM modules (nav): Deals, Leads, Contacts, Companies, Emails, Calls, Meetings.
 * Keep in sync with `server/apps/auth/src/permissions.ts`.
 */
const crmActions = ["create", "read", "update", "delete", "manage"] as const

export const statement = {
  ...defaultStatements,
  deal: crmActions,
  lead: crmActions,
  contact: crmActions,
  company: crmActions,
  email: crmActions,
  call: crmActions,
  meeting: crmActions,
} as const

export const ac = createAccessControl(statement)

const crmFull = {
  deal: ["create", "read", "update", "delete", "manage"],
  lead: ["create", "read", "update", "delete", "manage"],
  contact: ["create", "read", "update", "delete", "manage"],
  company: ["create", "read", "update", "delete", "manage"],
  email: ["create", "read", "update", "delete", "manage"],
  call: ["create", "read", "update", "delete", "manage"],
  meeting: ["create", "read", "update", "delete", "manage"],
} as const

const crmCrud = {
  deal: ["create", "read", "update", "delete"],
  lead: ["create", "read", "update", "delete"],
  contact: ["create", "read", "update", "delete"],
  company: ["create", "read", "update", "delete"],
  email: ["create", "read", "update", "delete"],
  call: ["create", "read", "update", "delete"],
  meeting: ["create", "read", "update", "delete"],
} as const

const crmRead = {
  deal: ["read"],
  lead: ["read"],
  contact: ["read"],
  company: ["read"],
  email: ["read"],
  call: ["read"],
  meeting: ["read"],
} as const

/** Full CRM + org ownership (includes `ac` so owners can manage dynamic roles). */
export const owner = ac.newRole({
  ...crmFull,
  ...ownerAc.statements,
})

/**
 * CRM CRUD (no `manage`) + org admin.
 * Includes `ac: create|read|update|delete` so admins can create org roles at runtime.
 */
export const admin = ac.newRole({
  ...crmCrud,
  ...adminAc.statements,
})

/** Read-only CRM + default member org permissions. */
export const member = ac.newRole({
  ...crmRead,
  ...memberAc.statements,
})

export const roles = { owner, admin, member } as const

export type PermissionMap = Record<string, string[]>

export const STATIC_ROLE_NAMES = ["owner", "admin", "member"] as const

export type StaticRoleName = (typeof STATIC_ROLE_NAMES)[number]

export const isStaticRoleName = (name: string): name is StaticRoleName =>
  (STATIC_ROLE_NAMES as readonly string[]).includes(name.toLowerCase())

type PermissionGroup = {
  title: string
  resources: {
    key: keyof typeof statement
    label: string
  }[]
}

export const permissionGroups: PermissionGroup[] = [
  {
    title: "Sales",
    resources: [
      { key: "deal", label: "Deals" },
      { key: "lead", label: "Leads" },
      { key: "contact", label: "Contacts" },
      { key: "company", label: "Companies" },
      { key: "email", label: "Emails" },
      { key: "call", label: "Calls" },
      { key: "meeting", label: "Meetings" },
    ],
  },
  {
    title: "Workspace",
    resources: [
      { key: "organization", label: "Organization" },
      { key: "member", label: "Members" },
      { key: "invitation", label: "Invitations" },
      { key: "team", label: "Teams" },
      { key: "ac", label: "Roles & access" },
    ],
  },
]

export const staticRoleDefinitions = [
  {
    name: "owner" as const,
    label: "Owner",
    description: "Full workspace control, including ownership actions.",
    permissions: owner.statements as PermissionMap,
  },
  {
    name: "admin" as const,
    label: "Admin",
    description: "Manage members, invitations, and CRM data.",
    permissions: admin.statements as PermissionMap,
  },
  {
    name: "member" as const,
    label: "Member",
    description: "Read-only CRM access by default.",
    permissions: member.statements as PermissionMap,
  },
]

export const countPermissions = (permissions: PermissionMap) =>
  Object.values(permissions).reduce((total, actions) => total + actions.length, 0)

export const emptyPermissionMap = (): PermissionMap => {
  const next: PermissionMap = {}
  for (const resource of Object.keys(statement)) {
    next[resource] = []
  }
  return next
}

export const normalizePermissionMap = (
  permissions: PermissionMap | null | undefined
): PermissionMap => {
  const next = emptyPermissionMap()
  if (!permissions) return next

  for (const [resource, actions] of Object.entries(permissions)) {
    if (!(resource in statement)) continue
    const allowed = new Set(statement[resource as keyof typeof statement])
    next[resource] = actions.filter((action) => allowed.has(action as never))
  }

  return next
}

export const compactPermissionMap = (permissions: PermissionMap): PermissionMap => {
  const next: PermissionMap = {}
  for (const [resource, actions] of Object.entries(permissions)) {
    if (actions.length > 0) next[resource] = [...actions]
  }
  return next
}
