import { Link } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  canManageRoles,
  deleteOrganizationRole,
  listOrganizationRoles,
  roleKeys,
} from "@/api/roles"
import {
  countPermissions,
  staticRoleDefinitions,
} from "@/lib/permissions"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  Delete02Icon,
  Edit02Icon,
} from "@hugeicons/core-free-icons"

const RolesSettingsPage = () => {
  const queryClient = useQueryClient()

  const canReadQuery = useQuery({
    queryKey: roleKeys.can("read"),
    queryFn: () => canManageRoles("read"),
  })

  const canCreateQuery = useQuery({
    queryKey: roleKeys.can("create"),
    queryFn: () => canManageRoles("create"),
  })

  const canUpdateQuery = useQuery({
    queryKey: roleKeys.can("update"),
    queryFn: () => canManageRoles("update"),
  })

  const canDeleteQuery = useQuery({
    queryKey: roleKeys.can("delete"),
    queryFn: () => canManageRoles("delete"),
  })

  const rolesQuery = useQuery({
    queryKey: roleKeys.list(),
    queryFn: listOrganizationRoles,
    enabled: canReadQuery.data === true,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteOrganizationRole,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: roleKeys.list() })
    },
  })

  const canCreate = canCreateQuery.data === true
  const canUpdate = canUpdateQuery.data === true
  const canDelete = canDeleteQuery.data === true
  const canRead = canReadQuery.data === true

  if (canReadQuery.isPending) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto p-12">
        <p className="text-sm text-muted-foreground">Loading roles...</p>
      </div>
    )
  }

  if (!canRead) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto p-12">
        <div className="w-full max-w-4xl">
          <h1 className="text-2xl font-semibold tracking-tight">
            Roles & Permissions
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You don&apos;t have permission to view organization roles.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto p-12">
      <div className="flex w-full max-w-4xl flex-col gap-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Roles & Permissions
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Built-in roles and custom roles for this workspace.
            </p>
          </div>

          {canCreate ? (
            <Button type="button" render={<Link to="/settings/roles/new" />}>
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
              Create role
            </Button>
          ) : null}
        </div>

        {rolesQuery.error ? (
          <p className="text-sm text-destructive">
            {(rolesQuery.error as Error).message}
          </p>
        ) : null}
        {deleteMutation.error ? (
          <p className="text-sm text-destructive">
            {(deleteMutation.error as Error).message}
          </p>
        ) : null}

        <section className="space-y-4">
          <div>
            <h2 className="text-base font-medium">Built-in roles</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              System roles are read-only and apply to every organization.
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-4">Role</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead className="pr-4 text-right">Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staticRoleDefinitions.map((role) => (
                  <TableRow key={role.name}>
                    <TableCell className="pl-4">
                      <div>
                        <p className="font-medium">{role.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {role.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {countPermissions(role.permissions)} actions
                    </TableCell>
                    <TableCell className="pr-4 text-right text-muted-foreground">
                      Built-in
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-base font-medium">Custom roles</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Organization-specific roles created by admins and owners.
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-4">Role</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead className="pr-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rolesQuery.isPending ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="px-4 py-8 text-center text-sm text-muted-foreground"
                    >
                      Loading custom roles...
                    </TableCell>
                  </TableRow>
                ) : (rolesQuery.data?.length ?? 0) === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="px-4 py-8 text-center text-sm text-muted-foreground"
                    >
                      No custom roles yet.
                      {canCreate ? " Create one to get started." : ""}
                    </TableCell>
                  </TableRow>
                ) : (
                  rolesQuery.data?.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="pl-4 font-medium capitalize">
                        {role.role}
                      </TableCell>
                      <TableCell>
                        {countPermissions(role.permission ?? {})} actions
                      </TableCell>
                      <TableCell className="pr-4">
                        <div className="flex justify-end gap-1">
                          {canUpdate ? (
                            <Button
                              type="button"
                              size="icon-sm"
                              variant="ghost"
                              render={
                                <Link to={`/settings/roles/${role.id}`} />
                              }
                            >
                              <HugeiconsIcon
                                icon={Edit02Icon}
                                strokeWidth={2}
                              />
                            </Button>
                          ) : null}
                          {canDelete ? (
                            <Button
                              type="button"
                              size="icon-sm"
                              variant="ghost"
                              disabled={deleteMutation.isPending}
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Delete role "${role.role}"? Members using it must be reassigned first.`
                                  )
                                ) {
                                  deleteMutation.mutate(role.id)
                                }
                              }}
                            >
                              <HugeiconsIcon
                                icon={Delete02Icon}
                                strokeWidth={2}
                              />
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>
    </div>
  )
}

export default RolesSettingsPage
