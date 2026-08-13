import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
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
import { Badge } from "@/components/reui/badge"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame"
import {
  Timeline,
  TimelineContent,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from "@/components/reui/timeline"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { Item, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item"
type WorkflowTab = "editor" | "executions" | "evaluations"

type WorkflowExecutionsProps = {
  workflowId?: string
  tab: WorkflowTab
  onTabChange: (tab: WorkflowTab) => void
}

const TRIGGER_STEP_ID = "trigger"

const panelTransition = {
  duration: 0.32,
  ease: [0.22, 1, 0.36, 1] as const,
}

const statusVariant = (
  status: string
): "success-light" | "destructive-light" | "info-light" | "secondary" => {
  if (status === "COMPLETED" || status === "SUCCESS") return "success-light"
  if (status === "FAILED") return "destructive-light"
  if (status === "RUNNING" || status === "PENDING" || status === "ENQUEUED") {
    return "info-light"
  }
  return "secondary"
}

const formatStatus = (status: string) => {
  if (status === "COMPLETED") return "Success"
  return status.toLowerCase().replace(/_/g, " ")
}

const formatRelative = (value: string | null | undefined) => {
  if (!value) return ""
  const diffMs = Date.now() - new Date(value).getTime()
  const minutes = Math.max(0, Math.round(diffMs / 60000))
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return `${days}d ago`
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
    return String(trigger?.settings?.eventName ?? "Start")
  }
  const step = steps.find((item) => item.id === stepId)
  return step?.name || step?.type || stepId
}

const stepType = (
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
    <pre className="max-h-64 overflow-auto rounded-lg bg-muted/70 p-3 text-left text-xs leading-relaxed">
      {JSON.stringify(value, null, 2)}
    </pre>
  )
}

const ExecutionStep = ({
  step,
  stepId,
  info,
  trigger,
  steps,
}: {
  step: number
  stepId: string
  info?: WorkflowRunStepInfo
  trigger?: WorkflowTrigger
  steps: WorkflowAction[]
}) => {
  const status = info?.status ?? "NOT_STARTED"
  const type = stepType(stepId, trigger, steps)
  const title =
    stepId === TRIGGER_STEP_ID ? "Start" : stepTitle(stepId, trigger, steps)
  const isActive = status === "RUNNING" || status === "PENDING"

  return (
    <TimelineItem step={step} className="ms-10 pb-10">
      <TimelineHeader>
        <TimelineSeparator className="group-data-[orientation=vertical]/timeline:-left-7 group-data-[orientation=vertical]/timeline:h-[calc(100%-1.5rem-0.25rem)] group-data-[orientation=vertical]/timeline:translate-y-7" />
        <div className="flex items-center gap-2">
          <TimelineTitle className="text-sm font-semibold">{title}</TimelineTitle>
        </div>
        <TimelineIndicator
          className={cn(
            "bg-muted text-muted-foreground group-data-completed/timeline-item:bg-primary group-data-completed/timeline-item:text-primary-foreground flex size-6 items-center justify-center border-none group-data-[orientation=vertical]/timeline:-left-7",
            isActive && "ring-primary/20 ring-2"
          )}
        />
      </TimelineHeader>
      <TimelineContent className="mt-2">
        <Item variant={'outline'}>
          <ItemContent>
            <ItemTitle>Output</ItemTitle>
            <ItemDescription className="capitalize">
              {type.replace(/_/g, " ").toLowerCase()}
            </ItemDescription>
            {info?.error ? (
              <p className="mb-2 text-sm text-destructive">{info.error}</p>
            ) : null}
            <JsonBlock value={info?.result} />

          </ItemContent>
        </Item>
      </TimelineContent>
    </TimelineItem>
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
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const open = tab === "executions"
  const showingDetails = Boolean(selectedRunId)

  useEffect(() => {
    if (!open || !organizationId || !workflowId) {
      setRuns([])
      return
    }

    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const next = await listWorkflowRuns(organizationId, workflowId)
        if (!cancelled) setRuns(next)
      } catch (loadError: unknown) {
        if (!cancelled) {
          setRuns([])
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load runs"
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [open, organizationId, workflowId])

  useEffect(() => {
    if (!open || !organizationId || !workflowId || !selectedRunId) {
      setDetail(null)
      return
    }

    let cancelled = false
    setDetailLoading(true)
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
      .finally(() => {
        if (!cancelled) setDetailLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, organizationId, selectedRunId, workflowId])

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
    if (!open || !organizationId || !workflowId || !isLive) return

    const timer = window.setInterval(() => {
      void listWorkflowRuns(organizationId, workflowId).then(setRuns)
      if (selectedRunId) {
        void getWorkflowRun(organizationId, workflowId, selectedRunId).then(
          setDetail
        )
      }
    }, 2000)

    return () => window.clearInterval(timer)
  }, [isLive, open, organizationId, selectedRunId, workflowId])

  const stepIds = useMemo(() => {
    if (!detail) return []
    return orderedStepIds(detail.state.flow.trigger, detail.state.flow.steps)
  }, [detail])

  const completedStep = useMemo(() => {
    let count = 0
    for (const stepId of stepIds) {
      const status = detail?.state.stepInfos[stepId]?.status
      if (status === "SUCCESS" || status === "COMPLETED") {
        count += 1
      } else {
        break
      }
    }
    return count
  }, [detail, stepIds])

  const closeSheet = (nextOpen: boolean) => {
    if (nextOpen) return
    setSelectedRunId(null)
    setDetail(null)
    onTabChange("editor")
  }

  const backToList = () => {
    setSelectedRunId(null)
    setDetail(null)
  }

  return (
    <Sheet open={open} onOpenChange={closeSheet}>
      <SheetContent
        side="right"
        className="top-4 right-4 bottom-4 h-auto max-h-[calc(100dvh-2rem)] w-full !max-w-5xl gap-0 overflow-hidden rounded-xl border border-border p-0 shadow-xl sm:max-w-3xl data-[side=right]:inset-y-4 data-[side=right]:h-auto data-[side=right]:w-[min(100%-2rem,48rem)] data-[side=right]:border-l-0"
      >
        <SheetHeader className="shrink-0 flex-row items-center gap-3 space-y-0 border-b border-border px-4 py-3 pr-12">
          {showingDetails ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={backToList}
              aria-label="Back to runs"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
            </Button>
          ) : null}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <SheetTitle className="text-base">
                {showingDetails ? "Run Details" : "Executions"}
              </SheetTitle>
              {detail ? (
                <Badge
                  variant={statusVariant(detail.status)}
                  className="capitalize"
                >
                  {formatStatus(detail.status)}
                </Badge>
              ) : null}
            </div>
            <SheetDescription className="sr-only">
              Workflow run history and node output.
            </SheetDescription>
          </div>
        </SheetHeader>

        <div className="relative min-h-0 flex-1 overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            {!showingDetails ? (
              <motion.div
                key="list"
                initial={{ x: -28, opacity: 0, filter: "blur(10px)" }}
                animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
                exit={{ x: -36, opacity: 0, filter: "blur(10px)" }}
                transition={panelTransition}
                className="absolute inset-0 flex flex-col"
              >
                {!workflowId ? (
                  <div className="flex flex-1 items-center justify-center p-8 text-center">
                    <div>
                      <p className="text-sm font-medium">Save the workflow first</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Publish and run this automation to see execution logs.
                      </p>
                    </div>
                  </div>
                ) : error && runs.length === 0 ? (
                  <p className="p-4 text-sm text-destructive">{error}</p>
                ) : loading && runs.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground">
                    Loading runs...
                  </p>
                ) : runs.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center p-8 text-center">
                    <div>
                      <p className="text-sm font-medium">No executions yet</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        When this automation runs, history will show up here.
                      </p>
                    </div>
                  </div>
                ) : (
                  <ScrollArea className="min-h-0 flex-1">
                    <div className="p-4">
                      <Frame spacing="xs">
                        <FrameHeader>
                          <FrameTitle>Run history</FrameTitle>
                          <FrameDescription>
                            Past executions of this automation, including status
                            and when each run started.
                          </FrameDescription>
                        </FrameHeader>
                        <FramePanel className="!p-0">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Started</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {runs.map((run) => (
                                <TableRow
                                  key={run.id}
                                  className="cursor-pointer"
                                  onClick={() => setSelectedRunId(run.id)}
                                >
                                  <TableCell className="font-medium">
                                    {run.name ?? "Run"}
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={statusVariant(run.status)}
                                      className="capitalize"
                                    >
                                      {formatStatus(run.status)}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-muted-foreground">
                                    {formatRelative(
                                      run.startedAt ?? run.createdAt
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </FramePanel>
                      </Frame>
                    </div>
                  </ScrollArea>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="details"
                initial={{ x: 40, opacity: 0, filter: "blur(12px)" }}
                animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
                exit={{ x: 40, opacity: 0, filter: "blur(10px)" }}
                transition={panelTransition}
                className="absolute inset-0 flex flex-col"
              >
                {detailLoading && !detail ? (
                  <p className="p-4 text-sm text-muted-foreground">
                    Loading run...
                  </p>
                ) : !detail ? (
                  <p className="p-4 text-sm text-muted-foreground">
                    Could not load this run.
                  </p>
                ) : (
                  <ScrollArea className="min-h-0 flex-1">
                    <div className="p-4">
                      <Timeline value={completedStep}>
                        {stepIds.map((stepId, index) => (
                          <ExecutionStep
                            key={stepId}
                            step={index + 1}
                            stepId={stepId}
                            info={detail.state.stepInfos[stepId]}
                            trigger={detail.state.flow.trigger}
                            steps={detail.state.flow.steps}
                          />
                        ))}
                      </Timeline>
                    </div>
                  </ScrollArea>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export type { WorkflowTab }
