import { FormEvent, useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "@/components/ui/toast"
import { organization } from "@/lib/auth-client"

type OrgMember = {
  id: string
  role: string
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
  } | null
}

type OrgInvitation = {
  id: string
  email: string
  role: string
  status: string
}

type UserInvitation = {
  id: string
  email: string
  role: string
  status: string
  organizationId: string
  organizationName?: string | null
}

type FullOrganization = {
  id: string
  name: string
  slug: string
  members?: OrgMember[]
  invitations?: OrgInvitation[]
}

const OrganizationSettingsPage = () => {
  const [org, setOrg] = useState<FullOrganization | null>(null)
  const [myInvites, setMyInvites] = useState<UserInvitation[]>([])
  const [inviteEmail, setInviteEmail] = useState("")
  const [loading, setLoading] = useState(true)
  const [inviting, setInviting] = useState(false)
  const [actingInviteId, setActingInviteId] = useState<string | null>(null)

  const loadPage = useCallback(async () => {
    setLoading(true)

    const [orgResult, invitesResult, listResult] = await Promise.all([
      organization.getFullOrganization(),
      organization.listUserInvitations(),
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

    if (invitesResult.error) {
      setMyInvites([])
    } else {
      setMyInvites((invitesResult.data as UserInvitation[] | null) ?? [])
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    void loadPage()
  }, [loadPage])

  const handleInvite = async (event: FormEvent) => {
    event.preventDefault()
    const email = inviteEmail.trim()
    if (!email || inviting || !org) return

    setInviting(true)

    const { error: inviteError } = await organization.inviteMember({
      email,
      role: "member",
    })

    if (inviteError) {
      const message = inviteError.message ?? "Failed to send invite"
      toast.add({
        type: "error",
        title: "Invitation failed",
        description: message,
      })
      setInviting(false)
      return
    }

    toast.add({
      type: "success",
      title: "Invitation sent",
      description: `An invite was sent to ${email}.`,
    })

    setInviteEmail("")
    setInviting(false)
    await loadPage()
  }

  const handleAccept = async (invitationId: string) => {
    setActingInviteId(invitationId)
    setError(null)

    const { data, error: acceptError } = await organization.acceptInvitation({
      invitationId,
    })

    if (acceptError) {
      setError(acceptError.message ?? "Failed to accept invitation")
      setActingInviteId(null)
      return
    }

    const organizationId =
      (data as { invitation?: { organizationId?: string } } | null)?.invitation
        ?.organizationId ??
      myInvites.find((invite) => invite.id === invitationId)?.organizationId

    if (organizationId) {
      await organization.setActive({ organizationId })
    }

    setActingInviteId(null)
    await loadPage()
  }

  const handleReject = async (invitationId: string) => {
    setActingInviteId(invitationId)
    setError(null)

    const { error: rejectError } = await organization.rejectInvitation({
      invitationId,
    })

    if (rejectError) {
      setError(rejectError.message ?? "Failed to reject invitation")
      setActingInviteId(null)
      return
    }

    setActingInviteId(null)
    await loadPage()
  }

  if (loading) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto p-12">
        <p className="text-sm text-muted-foreground">Loading organization...</p>
      </div>
    )
  }

  const members = org?.members ?? []
  const outgoingInvitations = (org?.invitations ?? []).filter(
    (invite) => invite.status === "pending"
  )

  return (
    <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto p-12">
      <div className="flex w-full max-w-4xl flex-col gap-10">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Organization</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Workspace details, members, and invitations.
          </p>
        </div>

        {!org ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              No active workspace selected. Accept an invite above or create a
              workspace.
            </p>
            <Button render={<Link to="/create-workspace" />}>
              Create workspace
            </Button>
          </div>
        ) : (
          <>
            <section className="space-y-4">
              <div>
                <h2 className="text-base font-medium">Workspace details</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Basic identity for this sales workspace.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Name</Label>
                  <Input id="org-name" value={org.name} readOnly />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-slug">Slug</Label>
                  <Input id="org-slug" value={org.slug} readOnly />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <h2 className="text-base font-medium">Members</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  People who already belong to this workspace.
                </p>
              </div>

              <div className="rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="text-muted-foreground"
                        >
                          No members yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      members.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell>{member.user?.name || "—"}</TableCell>
                          <TableCell>{member.user?.email || "—"}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="capitalize">
                              {member.role}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </section>


        <section className="space-y-4">
          <div>
            <h2 className="text-base font-medium">Accept invites</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Workspaces that invited your email. Accept to join.
            </p>
          </div>

          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Workspace</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myInvites.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground">
                      No invitations to accept.
                    </TableCell>
                  </TableRow>
                ) : (
                  myInvites.map((invite) => {
                    const busy = actingInviteId === invite.id
                    return (
                      <TableRow key={invite.id}>
                        <TableCell>
                          {invite.organizationName || "Workspace"}
                        </TableCell>
                        <TableCell className="capitalize">
                          {invite.role}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {invite.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busy}
                              onClick={() => void handleReject(invite.id)}
                            >
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              disabled={busy}
                              onClick={() => void handleAccept(invite.id)}
                            >
                              {busy ? "Working..." : "Accept"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </section>

            <section className="space-y-4">
              <div>
                <h2 className="text-base font-medium">Invited members</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pending invitations waiting to join this workspace.
                </p>
              </div>

              <form
                className="flex flex-col gap-2 sm:flex-row"
                onSubmit={(event) => void handleInvite(event)}
              >
                <Input
                  type="email"
                  placeholder="teammate@company.com"
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  className="sm:max-w-sm"
                  required
                />
                <Button type="submit" disabled={inviting}>
                  {inviting ? "Sending..." : "Invite member"}
                </Button>
              </form>

              <div className="rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {outgoingInvitations.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="text-muted-foreground"
                        >
                          No pending invitations.
                        </TableCell>
                      </TableRow>
                    ) : (
                      outgoingInvitations.map((invite) => (
                        <TableRow key={invite.id}>
                          <TableCell>{invite.email}</TableCell>
                          <TableCell className="capitalize">
                            {invite.role}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {invite.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}

export default OrganizationSettingsPage
