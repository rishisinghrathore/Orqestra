import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Frame, FramePanel } from "@/components/reui/frame"
import { IconStack } from "@/components/reui/icon-stack"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, FlashIcon } from "@hugeicons/core-free-icons"
import { listWorkflows, type WorkflowSummary } from "@/api/workflow"
import { authClient } from "@/lib/auth-client"
import { DeleteWorkflowDialog } from "@/components/automations/delete-workflow-dialog"

const statusVariant = (
  status: string
): "default" | "secondary" | "outline" => {
  if (status === "ACTIVE") return "default"
  if (status === "DRAFT") return "secondary"
  return "outline"
}

const AutomationsPage = () => {
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<WorkflowSummary | null>(null)
  const { data: activeOrganization } = authClient.useActiveOrganization()
  const organizationId = activeOrganization?.id

  useEffect(() => {
    if (!organizationId) return
    let cancelled = false
    setLoading(true)
    setError(null)
    void listWorkflows(organizationId)
      .then((items) => {
        if (!cancelled) setWorkflows(items)
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setWorkflows([])
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load workflows"
          )
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [organizationId])

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    const next = !normalized
      ? workflows
      : workflows.filter(
          (item) =>
            (item.name ?? "").toLowerCase().includes(normalized) ||
            item.status.toLowerCase().includes(normalized)
        )
    return [...next].sort((a, b) =>
      (a.name ?? "").localeCompare(b.name ?? "")
    )
  }, [query, workflows])

  const reloadWorkflows = () => {
    if (!organizationId) return
    setLoading(true)
    setError(null)
    void listWorkflows(organizationId)
      .then(setWorkflows)
      .catch((loadError: unknown) => {
        setWorkflows([])
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load workflows"
        )
      })
      .finally(() => setLoading(false))
  }

  const isEmpty = !loading && !error && workflows.length === 0

  const deleteDialog = (
    <DeleteWorkflowDialog
      workflow={deleteTarget}
      organizationId={organizationId}
      open={Boolean(deleteTarget)}
      onOpenChange={(open) => {
        if (!open) setDeleteTarget(null)
      }}
      onDeleted={reloadWorkflows}
    />
  )

  if (isEmpty) {
    return (
      <>
        <div className="no-scrollbar flex min-h-0 flex-1 items-center justify-center overflow-y-auto p-12">
          <Empty className="max-w-md py-10">
            <EmptyHeader>
              <EmptyMedia>
                <IconStack
                  aria-hidden="true"
                  className="h-24 w-22 text-primary"
                >
                  <HugeiconsIcon
                    icon={FlashIcon}
                    strokeWidth={2}
                    className="size-5 text-primary"
                  />
                </IconStack>
              </EmptyMedia>
              <EmptyTitle>No automations yet</EmptyTitle>
              <EmptyDescription>
                Create your first workflow to react to records, schedules, and
                webhooks.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                type="button"
                size="sm"
                render={<Link to="/automations/new" />}
              >
                <HugeiconsIcon
                  icon={Add01Icon}
                  strokeWidth={2}
                  data-icon="inline-start"
                />
                Create automation
              </Button>
            </EmptyContent>
          </Empty>
        </div>
        {deleteDialog}
      </>
    )
  }

  return (
    <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto p-12">
      <div className="flex w-full max-w-5xl flex-col gap-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Automations
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Build workflows that react to records, schedules, and webhooks.
            </p>
          </div>

          <Button
            type="button"
            render={<Link to="/automations/new" />}
          >
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
            Create automation
          </Button>
        </div>

        <section className="space-y-4">
          <div>
            <h2 className="text-base font-medium">Workflows</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Published workflows run on database events via BullMQ workers.
            </p>
          </div>

          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search automations..."
            className="sm:max-w-sm"
          />

          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}

          <Frame spacing="xs">
            <FramePanel className="!p-0">
              <Table className="table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Runs</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-muted-foreground">
                        Loading workflows...
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-muted-foreground">
                        No automations match your search.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((automation) => (
                      <TableRow
                        key={automation.id}
                        className="cursor-pointer"
                        onClick={() => navigate(`/automations/${automation.id}`)}
                      >
                        <TableCell>
                          <span className="font-medium">
                            {automation.name ?? "Untitled workflow"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={statusVariant(automation.status)}
                            className="capitalize"
                          >
                            {automation.status.toLowerCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>{automation.runs}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(automation.updatedAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={(event) => {
                              event.stopPropagation()
                              setDeleteTarget(automation)
                            }}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </FramePanel>
          </Frame>
        </section>
      </div>

      {deleteDialog}
    </div>
  )
}

export default AutomationsPage
