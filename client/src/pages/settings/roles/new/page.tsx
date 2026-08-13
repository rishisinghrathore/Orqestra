import { FormEvent, useState } from "react"
import { Link, Navigate, useNavigate } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { PermissionCheckboxForm } from "@/components/settings/permission-checkbox-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  canManageRoles,
  createOrganizationRole,
  roleKeys,
} from "@/api/roles"
import {
  compactPermissionMap,
  emptyPermissionMap,
  isStaticRoleName,
} from "@/lib/permissions"

const CreateRolePage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [name, setName] = useState("")
  const [permissions, setPermissions] = useState(emptyPermissionMap)
  const [formError, setFormError] = useState<string | null>(null)

  const canCreateQuery = useQuery({
    queryKey: roleKeys.can("create"),
    queryFn: () => canManageRoles("create"),
  })

  const createMutation = useMutation({
    mutationFn: createOrganizationRole,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: roleKeys.list() })
      navigate("/settings/roles")
    },
    onError: (error: Error) => {
      setFormError(error.message)
    },
  })

  if (canCreateQuery.isPending) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto p-12">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!canCreateQuery.data) {
    return <Navigate to="/settings/roles" replace />
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

    createMutation.mutate({
      role: roleName,
      permission: compactPermissionMap(permissions),
    })
  }

  return (
    <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto p-12">
      <div className="flex w-full max-w-4xl flex-col gap-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Create role
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Name the role and select the permissions it should include.
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
            />
            <p className="text-xs text-muted-foreground">
              Saved as lowercase with hyphens. Cannot match owner, admin, or
              member.
            </p>
          </div>

          <PermissionCheckboxForm
            value={permissions}
            onChange={setPermissions}
            disabled={createMutation.isPending}
          />

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create role"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={createMutation.isPending}
              render={<Link to="/settings/roles" />}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateRolePage
