import { organization } from "@/lib/auth-client"
import type { PermissionMap } from "@/lib/permissions"

export type OrganizationRole = {
  id: string
  role: string
  permission: PermissionMap
  organizationId: string
  createdAt?: string | Date
  updatedAt?: string | Date
}

export const roleKeys = {
  all: ["organization-roles"] as const,
  list: () => [...roleKeys.all, "list"] as const,
  detail: (roleId: string) => [...roleKeys.all, "detail", roleId] as const,
  can: (action: string) => [...roleKeys.all, "can", action] as const,
}

export async function listOrganizationRoles() {
  const { data, error } = await organization.listRoles()
  if (error) {
    throw new Error(error.message ?? "Failed to load roles")
  }
  return (data ?? []) as OrganizationRole[]
}

export async function getOrganizationRole(roleId: string) {
  // get-role is a GET endpoint; Better Auth only forwards `query` for GET.
  const { data, error } = await organization.getRole({
    query: { roleId },
  })
  if (error) {
    throw new Error(error.message ?? "Failed to load role")
  }
  return data as OrganizationRole
}

export async function createOrganizationRole(input: {
  role: string
  permission: PermissionMap
}) {
  const { data, error } = await organization.createRole({
    role: input.role,
    permission: input.permission,
  })
  if (error) {
    throw new Error(error.message ?? "Failed to create role")
  }
  return data
}

export async function updateOrganizationRole(input: {
  roleId: string
  roleName?: string
  permission: PermissionMap
}) {
  const { data, error } = await organization.updateRole({
    roleId: input.roleId,
    data: {
      roleName: input.roleName,
      permission: input.permission,
    },
  })
  if (error) {
    throw new Error(error.message ?? "Failed to update role")
  }
  return data
}

export async function deleteOrganizationRole(roleId: string) {
  const { data, error } = await organization.deleteRole({ roleId })
  if (error) {
    throw new Error(error.message ?? "Failed to delete role")
  }
  return data
}

export async function canManageRoles(action: "create" | "read" | "update" | "delete") {
  const { data, error } = await organization.hasPermission({
    permissions: { ac: [action] },
  })
  if (error) {
    throw new Error(error.message ?? "Failed to check permissions")
  }
  return Boolean(data?.success)
}
