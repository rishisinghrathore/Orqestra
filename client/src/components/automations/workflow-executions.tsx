import { useEffect, useMemo, useState } from "react"
import {
  getWorkflowRun,
  listWorkflowRuns,
  type WorkflowAction,
  type WorkflowRunDetail,
  type WorkflowRunStepInfo,
  type WorkflowRunSummary,
  type WorkflowTrigger,
} from "@/api/workflow"
import { authClient } from "@/lib/auth-client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { IconStack } from "@/components/reui/icon-stack"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { HugeiconsIcon } from "@hugeicons/react"
import { ClockIcon } from "@hugeicons/core-free-icons"

type WorkflowTab = "editor" | "executions" | "evaluations"

type WorkflowExecutionsProps = {
  workflowId?: string
  tab: WorkflowTab
  onTabChange: (tab: WorkflowTab) => void
}

const TRIGGER_STEP_ID = "trigger"

const statusVariant = (
  status: string
): "default" | "secondary" | "destructive" | "outline" => {
  if (status === "COMPLETED" || status === "SUCCESS") return "default"
  if (status === "FAILED") return "destructive"
  if (status === "RUNNING" || status === "PENDING" || status === "ENQUEUED") {
    return "secondary"
  }
  return "outline"
}

const formatStatus = (status: string) =>
  status.toLowerCase().replace(/_/g, " ")

const formatTime = (value: string | null | undefined) => {
  if (!value) return "—"
  return new Date(value).toLocaleString()
}

const orderedStepIds = (
  trigger: WorkflowTrigger | undefined,
  steps: WorkflowAction[]
) => {
  const ids: string[] = [TRIGGER_STEP_ID]
  const seen = new Set(ids)
  const byId = new Map(steps.map((step) => [step.id, step]))
  const queue = [...(trigger?.nextStepIds ?? [])]

  while (queue.length > 0) {
    const id = queue.shift()
    if (!id || seen.has(id)) continue
    seen.add(id)
    ids.push(id)
    queue.push(...(byId.get(id)?.nextStepIds ?? []))
  }

  for (const step of steps) {
    if (!seen.has(step.id)) ids.push(step.id)
  }

  return ids
}

const stepTitle = (
  stepId: string,
  trigger: WorkflowTrigger | undefined,
  steps: WorkflowAction[]
) => {
  if (stepId === TRIGGER_STEP_ID) {
    const eventName = String(trigger?.settings?.eventName ?? "Trigger")
    return eventName
  }
  const step = steps.find((item) => item.id === stepId)
  return step?.name || step?.type || stepId
}

const stepTypeLabel = (
  stepId: string,
  trigger: WorkflowTrigger | undefined,
  steps: WorkflowAction[]
) => {
  if (stepId === TRIGGER_STEP_ID) return trigger?.type ?? "TRIGGER"
  return steps.find((item) => item.id === stepId)?.type ?? "STEP"
}

const JsonBlock = ({ value }: { value: unknown }) => {
  if (value == null) {
    return <p className="text-sm text-muted-foreground">No output</p>
  }

  return (
    <pre className="max-h-80 overflow-auto rounded-md bg-muted/60 p-3 text-left text-xs leading-relaxed">
      {JSON.stringify(value, null, 2)}
    </pre>
  )
}

const StepCard = ({
  stepId,
  info,
  trigger,
  steps,
}: {
  stepId: string
  info?: WorkflowRunStepInfo
  trigger?: WorkflowTrigger
  steps: WorkflowAction[]
}) => {
  const status = info?.status ?? "NOT_STARTED"

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">
            {stepTypeLabel(stepId, trigger, steps)}
          </p>
          <p className="mt-1 truncate text-sm font-medium">
            {stepTitle(stepId, trigger, steps)}
          </p>
        </div>
        <Badge variant={statusVariant(status)} className="capitalize">
          {formatStatus(status)}
        </Badge>
      </div>

      {info?.error ? (
        <p className="mt-3 text-sm text-destructive">{info.error}</p>
      ) : null}

      <div className="mt-3">
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">
          Output
        </p>
        <JsonBlock value={info?.result} />
      </div>
    </div>
  )
}

export const WorkflowTabBar = ({
  tab,
  onTabChange,
}: {
  tab: WorkflowTab
  onTabChange: (tab: WorkflowTab) => void
}) => {
  return (
    <ButtonGroup>
      <Button
        type="button"
        variant={tab === "editor" ? "default" : "secondary"}
        size="sm"
        onClick={() => onTabChange("editor")}
      >
        Editor
      </Button>
      <Button
        type="button"
        variant={tab === "executions" ? "default" : "secondary"}
        size="sm"
        onClick={() => onTabChange("executions")}
      >
        Executions
      </Button>
      <Button
        type="button"
        variant={tab === "evaluations" ? "default" : "secondary"}
        size="sm"
        onClick={() => onTabChange("evaluations")}
      >
        Evaluations
      </Button>
    </ButtonGroup>
  )
}

export const WorkflowExecutions = ({
  workflowId,
  tab,
  onTabChange,
}: WorkflowExecutionsProps) => {
  const { data: activeOrganization } = authClient.useActiveOrganization()
  const organizationId = activeOrganization?.id
  const [runs, setRuns] = useState<WorkflowRunSummary[]>([])
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)
  const [detail, setDetail] = useState<WorkflowRunDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!organizationId || !workflowId) {
      setRuns([])
      setSelectedRunId(null)
      setDetail(null)
      return
    }

    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const next = await listWorkflowRuns(organizationId, workflowId)
        if (cancelled) return
        setRuns(next)
        setSelectedRunId((current) => current ?? next[0]?.id ?? null)
      } catch (loadError: unknown) {
        if (cancelled) return
        setRuns([])
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load runs"
        )
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [organizationId, workflowId])

  useEffect(() => {
    if (!organizationId || !workflowId || !selectedRunId) {
      setDetail(null)
      return
    }

    let cancelled = false
    void getWorkflowRun(organizationId, workflowId, selectedRunId)
      .then((run) => {
        if (!cancelled) setDetail(run)
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setDetail(null)
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load run"
          )
        }
      })

    return () => {
      cancelled = true
    }
  }, [organizationId, selectedRunId, workflowId])

  const isLive =
    runs.some(
      (run) =>
        run.status === "ENQUEUED" ||
        run.status === "RUNNING" ||
        run.status === "PENDING"
    ) ||
    Object.values(detail?.state.stepInfos ?? {}).some(
      (step) => step.status === "PENDING" || step.status === "RUNNING"
    )

  useEffect(() => {
    if (!organizationId || !workflowId || !isLive) return

    const timer = window.setInterval(() => {
      void listWorkflowRuns(organizationId, workflowId).then(setRuns)
      if (selectedRunId) {
        void getWorkflowRun(organizationId, workflowId, selectedRunId).then(
          setDetail
        )
      }
    }, 2000)

    return () => window.clearInterval(timer)
  }, [isLive, organizationId, selectedRunId, workflowId])

  const stepIds = useMemo(() => {
    if (!detail) return []
    return orderedStepIds(detail.state.flow.trigger, detail.state.flow.steps)
  }, [detail])

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-muted/20">
      <div className="absolute top-3 left-1/2 z-10 -translate-x-1/2">
        <WorkflowTabBar tab={tab} onTabChange={onTabChange} />
      </div>

      {!workflowId ? (
        <div className="flex flex-1 items-center justify-center p-12">
          <Empty className="max-w-md py-10">
            <EmptyHeader>
              <EmptyMedia>
                <IconStack aria-hidden="true" className="h-24 w-22 text-primary">
                  <HugeiconsIcon
                    icon={ClockIcon}
                    strokeWidth={2}
                    className="size-5 text-primary"
                  />
                </IconStack>
              </EmptyMedia>
              <EmptyTitle>Save the workflow first</EmptyTitle>
              <EmptyDescription>
                Publish and run this automation to see execution logs here.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 pt-14">
          <aside className="flex w-72 shrink-0 flex-col border-r border-border bg-background">
            <div className="border-b border-border px-4 py-3">
              <p className="text-sm font-medium">Runs</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {runs.length} execution{runs.length === 1 ? "" : "s"}
              </p>
            </div>
            <ScrollArea className="min-h-0 flex-1">
              {error ? (
                <p className="p-4 text-sm text-destructive">{error}</p>
              ) : loading && runs.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">
                  Loading runs...
                </p>
              ) : runs.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">
                  No executions yet.
                </p>
              ) : (
                <div className="p-2">
                  {runs.map((run) => (
                    <button
                      key={run.id}
                      type="button"
                      className={cn(
                        "w-full rounded-md px-3 py-2.5 text-left transition-colors",
                        selectedRunId === run.id
                          ? "bg-muted"
                          : "hover:bg-muted/60"
                      )}
                      onClick={() => setSelectedRunId(run.id)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium">
                          {run.name ?? "Run"}
                        </span>
                        <Badge
                          variant={statusVariant(run.status)}
                          className="capitalize"
                        >
                          {formatStatus(run.status)}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatTime(run.startedAt ?? run.createdAt)}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </aside>

          <ScrollArea className="min-h-0 flex-1">
            {!detail ? (
              <div className="flex h-full items-center justify-center p-12">
                <p className="text-sm text-muted-foreground">
                  Select a run to inspect node output.
                </p>
              </div>
            ) : (
              <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-medium">
                      {detail.name ?? "Run"}
                    </h2>
                    <Badge
                      variant={statusVariant(detail.status)}
                      className="capitalize"
                    >
                      {formatStatus(detail.status)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Started {formatTime(detail.startedAt)} · Ended{" "}
                    {formatTime(detail.endedAt)}
                  </p>
                  {detail.error ? (
                    <p className="mt-2 text-sm text-destructive">
                      {detail.error}
                    </p>
                  ) : null}
                </div>

                {stepIds.map((stepId) => (
                  <StepCard
                    key={stepId}
                    stepId={stepId}
                    info={detail.state.stepInfos[stepId]}
                    trigger={detail.state.flow.trigger}
                    steps={detail.state.flow.steps}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  )
}

export type { WorkflowTab }
