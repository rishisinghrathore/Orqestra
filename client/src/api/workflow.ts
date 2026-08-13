import { isAxiosError } from "axios"
import type { Edge, Node } from "@xyflow/react"

import { api } from "@/lib/axios"

export type WorkflowFieldValues = Record<string, string | number | boolean | null>

export type WorkflowDelayDuration = {
  days?: number
  hours?: number
  minutes?: number
  seconds?: number
}

export type DelayDurationUnit = "seconds" | "minutes" | "hours" | "days"

export const DEFAULT_DELAY_DURATION: WorkflowDelayDuration = { minutes: 1 }

export const CUSTOM_DELAY_PRESET_ID = "custom"

export const DELAY_DURATION_PRESETS = [
  { id: "30s", label: "30 seconds", duration: { seconds: 30 } },
  { id: "1m", label: "1 minute", duration: { minutes: 1 } },
  { id: "5m", label: "5 minutes", duration: { minutes: 5 } },
  { id: "15m", label: "15 minutes", duration: { minutes: 15 } },
  { id: "30m", label: "30 minutes", duration: { minutes: 30 } },
  { id: "1h", label: "1 hour", duration: { hours: 1 } },
  { id: "6h", label: "6 hours", duration: { hours: 6 } },
  { id: "1d", label: "1 day", duration: { days: 1 } },
] as const

export function delayDurationTotalSeconds(
  duration?: WorkflowDelayDuration | null
) {
  if (!duration) return 0
  return (
    Number(duration.days ?? 0) * 24 * 60 * 60 +
    Number(duration.hours ?? 0) * 60 * 60 +
    Number(duration.minutes ?? 0) * 60 +
    Number(duration.seconds ?? 0)
  )
}

export function isPositiveDelayDuration(
  duration?: WorkflowDelayDuration | null
) {
  return delayDurationTotalSeconds(duration) > 0
}

export function parseDelayDuration(
  value: unknown
): WorkflowDelayDuration | undefined {
  if (!value || typeof value !== "object") return undefined
  const input = value as Record<string, unknown>
  const duration: WorkflowDelayDuration = {
    days: Number(input.days ?? 0) || undefined,
    hours: Number(input.hours ?? 0) || undefined,
    minutes: Number(input.minutes ?? 0) || undefined,
    seconds: Number(input.seconds ?? 0) || undefined,
  }
  return isPositiveDelayDuration(duration) ? duration : undefined
}

export function matchDelayPresetId(
  duration?: WorkflowDelayDuration | null
) {
  const total = delayDurationTotalSeconds(duration)
  const preset = DELAY_DURATION_PRESETS.find(
    (item) => delayDurationTotalSeconds(item.duration) === total
  )
  return preset?.id ?? CUSTOM_DELAY_PRESET_ID
}

export function formatDelayDuration(
  duration?: WorkflowDelayDuration | null
) {
  const preset = DELAY_DURATION_PRESETS.find(
    (item) =>
      delayDurationTotalSeconds(item.duration) ===
      delayDurationTotalSeconds(duration)
  )
  if (preset) return preset.label

  const parts: string[] = []
  const push = (count: number | undefined, singular: string) => {
    if (!count) return
    parts.push(`${count} ${singular}${count === 1 ? "" : "s"}`)
  }
  push(duration?.days, "day")
  push(duration?.hours, "hour")
  push(duration?.minutes, "minute")
  push(duration?.seconds, "second")
  return parts.join(" ") || "Set a duration"
}

export function durationFromCustomAmount(
  amount: number,
  unit: DelayDurationUnit
): WorkflowDelayDuration {
  return { [unit]: amount }
}

export function customFieldsFromDuration(
  duration?: WorkflowDelayDuration | null
): { amount: number; unit: DelayDurationUnit } {
  const total = delayDurationTotalSeconds(duration)
  if (total > 0 && total % (24 * 60 * 60) === 0) {
    return { amount: total / (24 * 60 * 60), unit: "days" }
  }
  if (total > 0 && total % (60 * 60) === 0) {
    return { amount: total / (60 * 60), unit: "hours" }
  }
  if (total > 0 && total % 60 === 0) {
    return { amount: total / 60, unit: "minutes" }
  }
  return { amount: total, unit: "seconds" }
}

export type WorkflowTriggerType = "DATABASE_EVENT" | "MANUAL" | "CRON" | "WEBHOOK"

export type WebhookHttpMethod = "GET" | "POST"

export const DEFAULT_WEBHOOK_BODY = { message: "Workflow was started" }

export function getWebhookTriggerDefaultSettings(httpMethod: WebhookHttpMethod) {
  if (httpMethod === "GET") {
    return {
      httpMethod,
      authentication: null,
      outputSchema: {},
    }
  }

  return {
    httpMethod,
    authentication: null,
    expectedBody: { ...DEFAULT_WEBHOOK_BODY },
    outputSchema: {},
  }
}

export function getWorkflowWebhookUrl(
  organizationId: string,
  workflowId: string
) {
  const base = String(import.meta.env.VITE_API_URL || window.location.origin).replace(
    /\/$/,
    ""
  )
  return `${base}/webhooks/workflows/${organizationId}/${workflowId}`
}

export type WorkflowTrigger = {
  type: WorkflowTriggerType
  settings: Record<string, unknown>
  nextStepIds?: string[]
}

export type WorkflowAction = {
  id: string
  type: string
  name: string
  settings: Record<string, unknown>
  nextStepIds?: string[]
}

export type WorkflowSummary = {
  id: string
  name: string | null
  runs: number
  status: string
  draftVersionId: string | null
  publishedVersionId: string | null
  updatedAt: string
}

export type WorkflowVersion = {
  id: string
  name: string | null
  trigger: WorkflowTrigger | null
  steps: WorkflowAction[] | null
  status: string
  workflow_id: string
}

export type WorkflowRunSummary = {
  id: string
  name: string | null
  status: string
  startedAt: string | null
  endedAt: string | null
  enqueuedAt: string | null
  createdAt: string
  error?: string | null
}

export type WorkflowRunStepInfo = {
  status: string
  result?: unknown
  error?: string
}

export type WorkflowRunDetail = WorkflowRunSummary & {
  state: {
    flow: {
      trigger: WorkflowTrigger
      steps: WorkflowAction[]
    }
    stepInfos: Record<string, WorkflowRunStepInfo>
    workflowRunError?: string
  }
}

type WorkflowNodeData = {
  blockId: string
  label: string
  description: string
  incomplete?: boolean
  objectId?: string
  objectLabel?: string
  objectNameSingular?: string
  fieldValues?: WorkflowFieldValues
  delayDuration?: WorkflowDelayDuration
  httpMethod?: WebhookHttpMethod
  expectedBody?: Record<string, unknown>
}

const TRIGGER_EVENT_BY_BLOCK: Record<string, string> = {
  "record-created": "created",
  "record-updated": "updated",
  "record-deleted": "deleted",
}

const ACTION_TYPE_BY_BLOCK: Record<string, string> = {
  "create-record": "CREATE_RECORD",
  "find-record": "FIND_RECORDS",
  "update-record": "UPDATE_RECORD",
  "delete-record": "DELETE_RECORD",
  "send-email": "SEND_EMAIL",
  "send-slack": "HTTP_REQUEST",
  wait: "DELAY",
  condition: "FILTER",
}

function workflowError(error: unknown, fallback: string) {
  if (isAxiosError(error)) {
    return (
      (error.response?.data as { message?: string } | undefined)?.message ??
      error.message
    )
  }
  if (error instanceof Error) return error.message
  return fallback
}

export function canvasToWorkflowDefinition(
  nodes: Node[],
  edges: Edge[],
  objectNameById: Record<string, string>
): { trigger: WorkflowTrigger | null; steps: WorkflowAction[] } {
  const workflowNodes = nodes
    .filter((node) => node.type === "trigger" || node.type === "action")
    .map((node) => node as Node<WorkflowNodeData>)

  const triggerNode = workflowNodes.find((node) => node.type === "trigger")
  const actionNodes = workflowNodes
    .filter((node) => node.type === "action")
    .sort((a, b) => a.position.x - b.position.x)

  const edgeTargets = new Map<string, string[]>()
  for (const edge of edges) {
    const current = edgeTargets.get(edge.source) ?? []
    current.push(edge.target)
    edgeTargets.set(edge.source, current)
  }

  const steps: WorkflowAction[] = actionNodes.map((node) => {
    const blockId = node.data.blockId
    const nextFromEdges = (edgeTargets.get(node.id) ?? []).filter((targetId) =>
      actionNodes.some((action) => action.id === targetId)
    )

    const settings: Record<string, unknown> = {
      input: {},
    }

    if (blockId === "wait") {
      settings.input = {
        delayType: "DURATION",
        duration: node.data.delayDuration ?? DEFAULT_DELAY_DURATION,
      }
    }

    if (blockId === "create-record" || blockId === "update-record") {
      const objectNameSingular =
        node.data.objectNameSingular ??
        (node.data.objectId ? objectNameById[node.data.objectId] : undefined)

      settings.input = {
        objectId: node.data.objectId,
        objectNameSingular,
        fields: node.data.fieldValues ?? {},
      }
    }

    return {
      id: node.id,
      type: ACTION_TYPE_BY_BLOCK[blockId] ?? "EMPTY",
      name: node.data.label,
      settings,
      nextStepIds:
        nextFromEdges.length > 0
          ? nextFromEdges
          : undefined,
    }
  })

  if (!triggerNode) {
    return { trigger: null, steps }
  }

  const triggerData = triggerNode.data
  const triggerNext = (edgeTargets.get(triggerNode.id) ?? []).filter((targetId) =>
    actionNodes.some((action) => action.id === targetId)
  )

  if (triggerData.blockId === "webhook") {
    const httpMethod: WebhookHttpMethod =
      triggerData.httpMethod === "POST" ? "POST" : "GET"
    const settings =
      httpMethod === "POST"
        ? {
            ...getWebhookTriggerDefaultSettings("POST"),
            expectedBody: triggerData.expectedBody ?? DEFAULT_WEBHOOK_BODY,
          }
        : getWebhookTriggerDefaultSettings("GET")

    return {
      trigger: {
        type: "WEBHOOK",
        settings,
        nextStepIds: triggerNext.length > 0 ? triggerNext : undefined,
      },
      steps,
    }
  }

  const event = TRIGGER_EVENT_BY_BLOCK[triggerData.blockId]
  const objectNameSingular =
    triggerData.objectNameSingular ??
    (triggerData.objectId
      ? objectNameById[triggerData.objectId]
      : undefined)

  const trigger: WorkflowTrigger = {
    type: "DATABASE_EVENT",
    settings: {
      eventName:
        objectNameSingular && event
          ? `${objectNameSingular}.${event}`
          : undefined,
      objectType: triggerData.objectId,
    },
    nextStepIds: triggerNext.length > 0 ? triggerNext : undefined,
  }

  return { trigger, steps }
}

export function workflowDefinitionToCanvas(
  trigger: WorkflowTrigger | null,
  steps: WorkflowAction[] | null
): { nodes: Node<WorkflowNodeData>[]; edges: Edge[] } {
  const nodes: Node<WorkflowNodeData>[] = []
  const edges: Edge[] = []

  if (trigger) {
    const triggerId = "trigger-root"

    if (trigger.type === "WEBHOOK") {
      const httpMethod: WebhookHttpMethod =
        trigger.settings.httpMethod === "POST" ? "POST" : "GET"
      const expectedBody =
        trigger.settings.expectedBody &&
        typeof trigger.settings.expectedBody === "object" &&
        !Array.isArray(trigger.settings.expectedBody)
          ? (trigger.settings.expectedBody as Record<string, unknown>)
          : undefined

      nodes.push({
        id: triggerId,
        type: "trigger",
        position: { x: 80, y: 180 },
        data: {
          blockId: "webhook",
          label: "Webhook",
          description: `${httpMethod} webhook`,
          httpMethod,
          expectedBody,
        },
      })
    } else {
      const eventName = String(trigger.settings.eventName ?? "")
      const [, action = "created"] = eventName.split(".")
      const blockId =
        action === "updated"
          ? "record-updated"
          : action === "deleted"
            ? "record-deleted"
            : "record-created"

      nodes.push({
        id: triggerId,
        type: "trigger",
        position: { x: 80, y: 180 },
        data: {
          blockId,
          label: "Trigger",
          description: eventName || "Database event",
          objectId: trigger.settings.objectType as string | undefined,
          objectNameSingular: eventName.split(".")[0],
          objectLabel: eventName.split(".")[0] || undefined,
        },
      })
    }

    for (const stepId of trigger.nextStepIds ?? []) {
      edges.push({
        id: `e-${triggerId}-${stepId}`,
        source: triggerId,
        target: stepId,
      })
    }
  }

  for (const [index, step] of (steps ?? []).entries()) {
    const blockId =
      Object.entries(ACTION_TYPE_BY_BLOCK).find(
        ([, type]) => type === step.type
      )?.[0] ?? "create-record"

    const input = (step.settings?.input ?? {}) as Record<string, unknown>
    const isRecordWrite =
      step.type === "CREATE_RECORD" || step.type === "UPDATE_RECORD"
    const isDelay = step.type === "DELAY"
    const delayDuration = isDelay
      ? (parseDelayDuration(input.duration) ?? DEFAULT_DELAY_DURATION)
      : undefined

    nodes.push({
      id: step.id,
      type: "action",
      position: { x: 80 + (index + 1) * 396, y: 180 },
      data: {
        blockId,
        label: step.name,
        description: isRecordWrite
          ? String(input.objectNameSingular ?? step.type)
          : isDelay
            ? formatDelayDuration(delayDuration)
            : step.type,
        objectId: isRecordWrite
          ? (input.objectId as string | undefined)
          : undefined,
        objectLabel: isRecordWrite
          ? String(input.objectNameSingular ?? "")
          : undefined,
        objectNameSingular: isRecordWrite
          ? (input.objectNameSingular as string | undefined)
          : undefined,
        fieldValues: isRecordWrite
          ? ((input.fields as WorkflowFieldValues | undefined) ?? {})
          : undefined,
        delayDuration,
        incomplete: isRecordWrite
          ? !input.objectId
          : isDelay
            ? !isPositiveDelayDuration(delayDuration)
            : undefined,
      },
    })

    for (const nextId of step.nextStepIds ?? []) {
      edges.push({
        id: `e-${step.id}-${nextId}`,
        source: step.id,
        target: nextId,
      })
    }
  }

  return { nodes, edges }
}

export async function listWorkflows(organizationId: string) {
  try {
    const { data } = await api.get<{ workflows: WorkflowSummary[] }>(
      "/api/workflows",
      { params: { organizationId } }
    )
    return data.workflows ?? []
  } catch (error) {
    throw new Error(workflowError(error, "Failed to load workflows"))
  }
}

export async function createWorkflow(organizationId: string, name: string) {
  try {
    const { data } = await api.post<{
      workflow: { id: string; name: string | null }
      draftVersion: WorkflowVersion
    }>("/api/workflows", { name }, { params: { organizationId } })
    return data
  } catch (error) {
    throw new Error(workflowError(error, "Failed to create workflow"))
  }
}

export async function getWorkflow(organizationId: string, workflowId: string) {
  try {
    const { data } = await api.get<{
      workflow: { id: string; name: string | null }
      draftVersion: WorkflowVersion | null
      runs: WorkflowRunSummary[]
    }>(`/api/workflows/${workflowId}`, { params: { organizationId } })
    return data
  } catch (error) {
    throw new Error(workflowError(error, "Failed to load workflow"))
  }
}

export async function saveWorkflowDraft(
  organizationId: string,
  workflowId: string,
  input: {
    name?: string
    trigger?: WorkflowTrigger | null
    steps?: WorkflowAction[] | null
  }
) {
  try {
    const { data } = await api.patch<{ draftVersion: WorkflowVersion }>(
      `/api/workflows/${workflowId}/draft`,
      input,
      { params: { organizationId } }
    )
    return data.draftVersion
  } catch (error) {
    throw new Error(workflowError(error, "Failed to save workflow"))
  }
}

export async function publishWorkflow(
  organizationId: string,
  workflowId: string
) {
  try {
    const { data } = await api.post<{ version: WorkflowVersion }>(
      `/api/workflows/${workflowId}/publish`,
      {},
      { params: { organizationId } }
    )
    return data.version
  } catch (error) {
    throw new Error(workflowError(error, "Failed to publish workflow"))
  }
}

export async function runWorkflow(
  organizationId: string,
  workflowId: string,
  payload: Record<string, unknown> = {}
) {
  try {
    const { data } = await api.post<{ run: { id: string; status: string } }>(
      `/api/workflows/${workflowId}/run`,
      { payload },
      { params: { organizationId } }
    )
    return data.run
  } catch (error) {
    throw new Error(workflowError(error, "Failed to run workflow"))
  }
}

export async function listWorkflowRuns(
  organizationId: string,
  workflowId: string
) {
  try {
    const { data } = await api.get<{ runs: WorkflowRunSummary[] }>(
      `/api/workflows/${workflowId}/runs`,
      { params: { organizationId } }
    )
    return data.runs ?? []
  } catch (error) {
    throw new Error(workflowError(error, "Failed to load workflow runs"))
  }
}

export async function getWorkflowRun(
  organizationId: string,
  workflowId: string,
  runId: string
) {
  try {
    const { data } = await api.get<{ run: WorkflowRunDetail }>(
      `/api/workflows/${workflowId}/runs/${runId}`,
      { params: { organizationId } }
    )
    return data.run
  } catch (error) {
    throw new Error(workflowError(error, "Failed to load workflow run"))
  }
}

export async function deleteWorkflow(
  organizationId: string,
  workflowId: string
) {
  try {
    await api.delete(`/api/workflows/${workflowId}`, {
      params: { organizationId },
    })
  } catch (error) {
    throw new Error(workflowError(error, "Failed to delete workflow"))
  }
}
