import { FormEvent, useCallback, useEffect, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { listOrganizationRoles, roleKeys } from "@/api/roles"
import { staticRoleDefinitions } from "@/lib/permissions"
import { organization } from "@/lib/auth-client"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  Delete02Icon,
  Edit02Icon,
} from "@hugeicons/core-free-icons"

type OrgMember = {
  id: string
  role: string
  createdAt?: string | Date | null
  user?: {
    id?: string
    name?: string | null
    email?: string | null
    image?: string | null
  } | null
}

type FullOrganization = {
  id: string
  name: string
  members?: OrgMember[]
}

const ADMIN_ROLES = new Set(["owner", "admin"])

const INVITEABLE_STATIC_ROLES = staticRoleDefinitions.filter(
  (role) => role.name !== "owner"
)

const formatRoleLabel = (roleName: string) => {
  const staticRole = staticRoleDefinitions.find(
    (role) => role.name === roleName.toLowerCase()
  )
  if (staticRole) return staticRole.label
  return roleName
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

const getInitials = (name?: string | null, email?: string | null) => {
  const source = name?.trim() || email?.trim() || "?"
  const parts = source.split(/\s+/).filter(Boolean)

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }

  return source.slice(0, 2).toUpperCase()
}

const formatDate = (value: string | Date | null | undefined) => {
  if (!value) return "—"
  const date = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

type MemberTableProps = {
  members: OrgMember[]
  selectedIds: Set<string>
  onToggle: (memberId: string, checked: boolean) => void
  onToggleAll: (checked: boolean) => void
  onRemove: (member: OrgMember) => void
  removingId: string | null
  emptyLabel: string
}

const MemberTable = ({
  members,
  selectedIds,
  onToggle,
  onToggleAll,
  onRemove,
  removingId,
  emptyLabel,
}: MemberTableProps) => {
  const allSelected =
    members.length > 0 && members.every((member) => selectedIds.has(member.id))

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-12 pl-4">
              <Checkbox
                checked={allSelected}
                onCheckedChange={(checked) => onToggleAll(checked === true)}
                aria-label="Select all"
                disabled={members.length === 0}
              />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Date added</TableHead>
            <TableHead>Last active</TableHead>
            <TableHead className="w-24 pr-4 text-right">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="px-4 py-8 text-center text-muted-foreground"
              >
                {emptyLabel}
              </TableCell>
            </TableRow>
          ) : (
            members.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="pl-4">
                  <Checkbox
                    checked={selectedIds.has(member.id)}
                    onCheckedChange={(checked) =>
                      onToggle(member.id, checked === true)
                    }
                    aria-label={`Select ${member.user?.name || member.user?.email || "member"}`}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="size-10">
                      {member.user?.image ? (
                        <AvatarImage
                          src={member.user.image}
                          alt={member.user.name || member.user.email || "Member"}
                        />
                      ) : null}
                      <AvatarFallback>
                        {getInitials(member.user?.name, member.user?.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {member.user?.name || "Unnamed"}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        {member.user?.email || "—"}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(member.createdAt)}
                </TableCell>
                <TableCell className="text-muted-foreground">—</TableCell>
                <TableCell className="pr-4">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      disabled={removingId === member.id}
                      onClick={() => onRemove(member)}
                      aria-label="Remove member"
                    >
                      <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
                    </Button>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Edit member"
                    >
                      <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

const TeamSettingsPage = () => {
  const [org, setOrg] = useState<FullOrganization | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [removingId, setRemovingId] = useState<string | null>(null)

  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("member")
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)

  const rolesQuery = useQuery({
    queryKey: roleKeys.list(),
    queryFn: listOrganizationRoles,
  })

  const roleOptions = useMemo(() => {
    const staticOptions = INVITEABLE_STATIC_ROLES.map((role) => ({
      value: role.name,
      label: role.label,
    }))

    const customOptions = (rolesQuery.data ?? [])
      .map((role) => role.role)
      .filter((name) => Boolean(name) && name.toLowerCase() !== "owner")
      .filter(
        (name, index, all) =>
          all.findIndex((item) => item.toLowerCase() === name.toLowerCase()) ===
          index
      )
      .filter(
        (name) =>
          !staticOptions.some(
            (option) => option.value.toLowerCase() === name.toLowerCase()
          )
      )
      .map((name) => ({
        value: name,
        label: formatRoleLabel(name),
      }))
      .sort((a, b) => a.label.localeCompare(b.label))

    return [...staticOptions, ...customOptions]
  }, [rolesQuery.data])

  useEffect(() => {
    if (!roleOptions.some((option) => option.value === inviteRole)) {
      setInviteRole(roleOptions[0]?.value ?? "member")
    }
  }, [inviteRole, roleOptions])

  const loadPage = useCallback(async () => {
    setLoading(true)
    setError(null)

    const [orgResult, listResult] = await Promise.all([
      organization.getFullOrganization(),
      organization.list(),
    ])

    let nextOrg = (orgResult.data as FullOrganization | null) ?? null

    if (!nextOrg && listResult.data && listResult.data.length > 0) {
      const first = listResult.data[0]
      await organization.setActive({ organizationId: first.id })
      const activated = await organization.getFullOrganization()
      nextOrg = (activated.data as FullOrganization | null) ?? null
    }

    setOrg(nextOrg)
    setSelectedIds(new Set())
    setLoading(false)
  }, [])

  useEffect(() => {
    void loadPage()
  }, [loadPage])

  const members = org?.members ?? []

  const adminUsers = useMemo(
    () => members.filter((member) => ADMIN_ROLES.has(member.role)),
    [members]
  )

  const accountUsers = useMemo(
    () => members.filter((member) => !ADMIN_ROLES.has(member.role)),
    [members]
  )

  const toggleMember = (memberId: string, checked: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (checked) next.add(memberId)
      else next.delete(memberId)
      return next
    })
  }

  const toggleGroup = (group: OrgMember[], checked: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      for (const member of group) {
        if (checked) next.add(member.id)
        else next.delete(member.id)
      }
      return next
    })
  }

  const onRemove = async (member: OrgMember) => {
    setRemovingId(member.id)
    setError(null)

    const { error: removeError } = await organization.removeMember({
      memberIdOrEmail: member.id,
    })

    if (removeError) {
      setError(removeError.message ?? "Failed to remove member")
      setRemovingId(null)
      return
    }

    setRemovingId(null)
    await loadPage()
  }

  const resetInviteForm = () => {
    setInviteEmail("")
    setInviteRole("member")
    setInviteError(null)
    setInviting(false)
  }

  const onInviteOpenChange = (open: boolean) => {
    setInviteOpen(open)
    if (!open) resetInviteForm()
  }

  const onInvite = async (event: FormEvent) => {
    event.preventDefault()
    const email = inviteEmail.trim()
    if (!email || inviting) return

    setInviting(true)
    setInviteError(null)

    const { error: inviteErr } = await organization.inviteMember({
      email,
      role: inviteRole,
    })

    if (inviteErr) {
      setInviteError(inviteErr.message ?? "Failed to send invite")
      setInviting(false)
      return
    }

    onInviteOpenChange(false)
    await loadPage()
  }

  if (loading) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto p-12">
        <p className="text-sm text-muted-foreground">Loading team...</p>
      </div>
    )
  }

  if (!org) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto p-12">
        <p className="text-sm text-muted-foreground">
          Select a workspace to manage team members.
        </p>
      </div>
    )
  }

  return (
    <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto p-12">
      <div className="flex w-full max-w-6xl flex-col gap-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Team members
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Manage your team members and their account permissions here.
            </p>
          </div>
          <Button
            type="button"
            className="shrink-0"
            onClick={() => setInviteOpen(true)}
          >
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
            Add team member
          </Button>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <section className="grid gap-6 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] lg:gap-10">
          <div className="space-y-1 lg:pt-1">
            <h2 className="text-base font-medium">Admin users</h2>
            <p className="text-sm text-muted-foreground">
              Admins can add and remove users and manage organization-level
              settings.
            </p>
          </div>
          <MemberTable
            members={adminUsers}
            selectedIds={selectedIds}
            onToggle={toggleMember}
            onToggleAll={(checked) => toggleGroup(adminUsers, checked)}
            onRemove={onRemove}
            removingId={removingId}
            emptyLabel="No admin users yet."
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] lg:gap-10">
          <div className="space-y-1 lg:pt-1">
            <h2 className="text-base font-medium">Account users</h2>
            <p className="text-sm text-muted-foreground">
              Account users can work in the pipeline and access shared workspace
              tools.
            </p>
          </div>
          <MemberTable
            members={accountUsers}
            selectedIds={selectedIds}
            onToggle={toggleMember}
            onToggleAll={(checked) => toggleGroup(accountUsers, checked)}
            onRemove={onRemove}
            removingId={removingId}
            emptyLabel="No account users yet."
          />
        </section>
      </div>

      <Dialog open={inviteOpen} onOpenChange={onInviteOpenChange}>
        <DialogContent className="sm:max-w-md" showCloseButton={!inviting}>
          <form onSubmit={onInvite} className="grid gap-6">
            <DialogHeader>
              <DialogTitle>Add team member</DialogTitle>
              <DialogDescription>
                Invite someone by email and choose their role in this workspace.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="invite-email">Email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  placeholder="name@company.com"
                  autoComplete="email"
                  autoFocus
                  required
                  disabled={inviting}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="invite-role">Role</Label>
                <Select
                  value={inviteRole}
                  onValueChange={(value) => {
                    if (value) setInviteRole(value)
                  }}
                  disabled={inviting || rolesQuery.isPending}
                >
                  <SelectTrigger id="invite-role" className="w-full">
                    <SelectValue
                      placeholder={
                        rolesQuery.isPending ? "Loading roles..." : "Select role"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {rolesQuery.error ? (
                  <p className="text-sm text-destructive">
                    {(rolesQuery.error as Error).message}
                  </p>
                ) : null}
              </div>
            </div>

            {inviteError ? (
              <p className="text-sm text-destructive">{inviteError}</p>
            ) : null}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={inviting}
                onClick={() => onInviteOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={inviting || !inviteEmail.trim()}
              >
                {inviting ? "Sending..." : "Send invite"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default TeamSettingsPage
