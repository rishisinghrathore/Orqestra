import { FormEvent, useEffect, useState } from "react"
import { Link, Navigate, useNavigate, useParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { PermissionCheckboxForm } from "@/components/settings/permission-checkbox-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  canManageRoles,
  deleteOrganizationRole,
  getOrganizationRole,
  roleKeys,
  updateOrganizationRole,
} from "@/api/roles"
import {
  compactPermissionMap,
  emptyPermissionMap,
  isStaticRoleName,
  normalizePermissionMap,
} from "@/lib/permissions"

const EditRolePage = () => {
  const { roleId = "" } = useParams<{ roleId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [name, setName] = useState("")
  const [permissions, setPermissions] = useState(emptyPermissionMap)
  const [formError, setFormError] = useState<string | null>(null)

  const canUpdateQuery = useQuery({
    queryKey: roleKeys.can("update"),
    queryFn: () => canManageRoles("update"),
  })

  const canDeleteQuery = useQuery({
    queryKey: roleKeys.can("delete"),
    queryFn: () => canManageRoles("delete"),
  })

  const roleQuery = useQuery({
    queryKey: roleKeys.detail(roleId),
    queryFn: () => getOrganizationRole(roleId),
    enabled: Boolean(roleId) && canUpdateQuery.data === true,
  })

  useEffect(() => {
    if (!roleQuery.data) return
    setName(roleQuery.data.role)
    setPermissions(normalizePermissionMap(roleQuery.data.permission))
  }, [roleQuery.data])

  const updateMutation = useMutation({
    mutationFn: updateOrganizationRole,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: roleKeys.list() }),
        queryClient.invalidateQueries({ queryKey: roleKeys.detail(roleId) }),
      ])
      navigate("/settings/roles")
    },
    onError: (error: Error) => {
      setFormError(error.message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteOrganizationRole,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: roleKeys.list() })
      navigate("/settings/roles")
    },
    onError: (error: Error) => {
      setFormError(error.message)
    },
  })

  if (canUpdateQuery.isPending) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto p-12">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!canUpdateQuery.data) {
    return <Navigate to="/settings/roles" replace />
  }

  if (roleQuery.isPending) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto p-12">
        <p className="text-sm text-muted-foreground">Loading role...</p>
      </div>
    )
  }

  if (roleQuery.error || !roleQuery.data) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto p-12">
        <div className="w-full max-w-4xl space-y-4">
          <p className="text-sm text-destructive">
            {(roleQuery.error as Error | null)?.message ?? "Role not found"}
          </p>
          <Button
            type="button"
            variant="outline"
            render={<Link to="/settings/roles" />}
          >
            Back to roles
          </Button>
        </div>
      </div>
    )
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)

    const roleName = name.trim().toLowerCase().replace(/\s+/g, "-")
    if (!roleName) {
      setFormError("Role name is required")
      return
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(roleName)) {
      setFormError(
        "Use letters, numbers, and hyphens only (e.g. sales-rep)."
      )
      return
    }

    if (isStaticRoleName(roleName)) {
      setFormError("That name is reserved for a built-in role")
      return
    }

    updateMutation.mutate({
      roleId,
      roleName,
      permission: compactPermissionMap(permissions),
    })
  }

  const busy = updateMutation.isPending || deleteMutation.isPending

  return (
    <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto p-12">
      <div className="flex w-full max-w-4xl flex-col gap-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Edit role</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Update the name and permissions for this custom role.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            render={<Link to="/settings/roles" />}
          >
            Back to roles
          </Button>
        </div>

        {formError ? (
          <p className="text-sm text-destructive">{formError}</p>
        ) : null}

        <form onSubmit={onSubmit} className="space-y-8">
          <div className="space-y-2 sm:max-w-md">
            <Label htmlFor="role-name">Role name</Label>
            <Input
              id="role-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="sales-rep"
              autoComplete="off"
              required
              disabled={busy}
            />
          </div>

          <PermissionCheckboxForm
            value={permissions}
            onChange={setPermissions}
            disabled={busy}
          />

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={busy}>
              {updateMutation.isPending ? "Saving..." : "Save changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              render={<Link to="/settings/roles" />}
            >
              Cancel
            </Button>
            {canDeleteQuery.data ? (
              <Button
                type="button"
                variant="destructive"
                disabled={busy}
                onClick={() => {
                  if (
                    window.confirm(
                      `Delete role "${roleQuery.data.role}"? Members using it must be reassigned first.`
                    )
                  ) {
                    deleteMutation.mutate(roleId)
                  }
                }}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete role"}
              </Button>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditRolePage
