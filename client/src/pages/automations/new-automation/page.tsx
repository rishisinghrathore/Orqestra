import { Button } from "@/components/ui/button"
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/components/ui/button-group"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ComponentProps,
} from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  Background,
  Handle,
  MarkerType,
  MiniMap,
  type Edge,
  type Node,
  type NodeProps,
  Panel,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  useStore,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { listDataObjects, type DataObject, type DataObjectField } from "@/api/data-model"
import {
  canvasToWorkflowDefinition,
  createWorkflow,
  CUSTOM_DELAY_PRESET_ID,
  customFieldsFromDuration,
  DEFAULT_DELAY_DURATION,
  DELAY_DURATION_PRESETS,
  durationFromCustomAmount,
  formatDelayDuration,
  getWorkflow,
  isPositiveDelayDuration,
  matchDelayPresetId,
  publishWorkflow,
  runWorkflow,
  saveWorkflowDraft,
  workflowDefinitionToCanvas,
  type DelayDurationUnit,
  type WorkflowDelayDuration,
  type WorkflowSummary,
} from "@/api/workflow"
import { authClient } from "@/lib/auth-client"
import { DeleteWorkflowDialog } from "@/components/automations/delete-workflow-dialog"
import {
  WorkflowExecutions,
  WorkflowTabBar,
  type WorkflowTab,
} from "@/components/automations/workflow-executions"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Frame,
  FrameHeader,
  FramePanel,
} from "@/components/reui/frame"
import { cn } from "@/lib/utils"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  ArrowDown01Icon,
  ArrowTurnBackwardIcon,
  ArrowTurnForwardIcon,
  Delete02Icon,
  FitToScreenIcon,
  FocusPointFreeIcons,
  LayoutGridIcon,
  MapsIcon,
  MinusSignIcon,
  PlayIcon,
  PlusSignFreeIcons,
  PlusSignIcon,
  ClockIcon,
  ArrowLeft01FreeIcons,
  ArrowLeft02FreeIcons,
} from "@hugeicons/core-free-icons"

type IconType = ComponentProps<typeof HugeiconsIcon>["icon"]

type BlockDef = {
  id: string
  kind: "trigger" | "action"
  label: string
  description: string
  category: string
}

const TRIGGER_BLOCKS: BlockDef[] = [
  {
    id: "record-created",
    kind: "trigger",
    label: "Record created",
    description: "When a record is created",
    category: "Records",
  },
  {
    id: "record-updated",
    kind: "trigger",
    label: "Record updated",
    description: "When a record is updated",
    category: "Records",
  },
  {
    id: "record-deleted",
    kind: "trigger",
    label: "Record deleted",
    description: "When a record is deleted",
    category: "Records",
  },
]

const ACTION_BLOCKS: BlockDef[] = [
  {
    id: "create-record",
    kind: "action",
    label: "Create record",
    description: "Create a new record",
    category: "Records",
  },
  {
    id: "find-record",
    kind: "action",
    label: "Find record",
    description: "Find a record",
    category: "Records",
  },
  {
    id: "update-record",
    kind: "action",
    label: "Update record",
    description: "Update an existing record",
    category: "Records",
  },
  {
    id: "delete-record",
    kind: "action",
    label: "Delete record",
    description: "Delete an existing record",
    category: "Records",
  },
  {
    id: "send-email",
    kind: "action",
    label: "Send email",
    description: "Send an email message",
    category: "Communication",
  },
  {
    id: "send-slack",
    kind: "action",
    label: "Send Slack message",
    description: "Post a message to Slack",
    category: "Communication",
  },
  {
    id: "wait",
    kind: "action",
    label: "Wait",
    description: "Pause the workflow for a duration",
    category: "Flow",
  },
  {
    id: "condition",
    kind: "action",
    label: "Condition",
    description: "Branch based on a condition",
    category: "Flow",
  },
]

const NODE_WIDTH = 300
const NODE_GAP_X = 96
const NODE_Y = 180
const NODE_START_X = 80

type WorkflowNodeData = {
  blockId: string
  label: string
  description: string
  incomplete?: boolean
  objectId?: string
  objectLabel?: string
  objectNameSingular?: string
  fieldValues?: Record<string, string | number | boolean | null>
  delayDuration?: WorkflowDelayDuration
}

const isRecordTrigger = (blockId: string) => blockId.startsWith("record-")

const isCreateRecordAction = (blockId: string) => blockId === "create-record"

const isUpdateRecordAction = (blockId: string) => blockId === "update-record"

const isRecordWriteAction = (blockId: string) =>
  isCreateRecordAction(blockId) || isUpdateRecordAction(blockId)

const isWaitAction = (blockId: string) => blockId === "wait"

const isRecordObjectBlock = (blockId: string) =>
  isRecordTrigger(blockId) || isRecordWriteAction(blockId)

type PlaceholderNodeData = {
  sourceNodeId: string
}

type TriggerFlowNode = Node<WorkflowNodeData, "trigger">
type ActionFlowNode = Node<WorkflowNodeData, "action">
type PlaceholderFlowNode = Node<PlaceholderNodeData, "placeholder">
type WorkflowFlowNode = TriggerFlowNode | ActionFlowNode | PlaceholderFlowNode

type CanvasActions = {
  requestAddAfter: (sourceNodeId: string) => void
  selectBlockForPlaceholder: (placeholderId: string, block: BlockDef) => void
  cancelPlaceholder: (placeholderId: string) => void
  openNodeConfig: (nodeId: string) => void
}

const CanvasActionsContext = createContext<CanvasActions | null>(null)

const useCanvasActions = () => {
  const ctx = useContext(CanvasActionsContext)
  if (!ctx) {
    throw new Error("Canvas actions unavailable")
  }
  return ctx
}

const blockToNodeData = (block: BlockDef): WorkflowNodeData => ({
  blockId: block.id,
  label: block.label,
  description: isWaitAction(block.id)
    ? formatDelayDuration(DEFAULT_DELAY_DURATION)
    : block.description,
  incomplete: isRecordObjectBlock(block.id),
  fieldValues: isRecordWriteAction(block.id) ? {} : undefined,
  delayDuration: isWaitAction(block.id) ? DEFAULT_DELAY_DURATION : undefined,
})

const createEdge = (source: string, target: string): Edge => ({
  id: `e-${source}-${target}`,
  source,
  target,
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 16,
    height: 16,
  },
  style: { strokeWidth: 1 },
})

const editableObjectFields = (fields: DataObjectField[]) =>
  fields.filter((field) => !field.isSystem)

const RecordFieldInput = ({
  field,
  value,
  onChange,
}: {
  field: DataObjectField
  value: string | number | boolean | null | undefined
  onChange: (next: string | number | boolean | null) => void
}) => {
  const fieldId = `field-${field.id}`

  if (field.type === "BOOLEAN") {
    return (
      <div className="flex items-center gap-2">
        <Checkbox
          id={fieldId}
          checked={Boolean(value)}
          onCheckedChange={(checked) => onChange(Boolean(checked))}
        />
        <Label htmlFor={fieldId} className="font-normal">
          {field.name}
        </Label>
      </div>
    )
  }

  if (field.type === "SELECT" && field.options?.length) {
    return (
      <div className="space-y-2">
        <Label htmlFor={fieldId}>{field.name}</Label>
        <Select
          value={value != null ? String(value) : ""}
          onValueChange={(next) => onChange(next || null)}
        >
          <SelectTrigger id={fieldId} className="h-10 w-full">
            <SelectValue placeholder={`Select ${field.name.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent align="start" alignItemWithTrigger={false}>
            {field.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  const inputType =
    field.type === "NUMBER"
      ? "number"
      : field.type === "DATE"
        ? "date"
        : field.type === "DATETIME"
          ? "datetime-local"
          : "text"

  return (
    <div className="space-y-2">
      <Label htmlFor={fieldId}>{field.name}</Label>
      <Input
        id={fieldId}
        type={inputType}
        value={value != null ? String(value) : ""}
        onChange={(event) => {
          const raw = event.target.value
          if (field.type === "NUMBER") {
            onChange(raw === "" ? null : Number(raw))
            return
          }
          onChange(raw)
        }}
        placeholder={`Enter ${field.name.toLowerCase()}`}
      />
    </div>
  )
}

const DELAY_UNITS: { value: DelayDurationUnit; label: string }[] = [
  { value: "seconds", label: "Seconds" },
  { value: "minutes", label: "Minutes" },
  { value: "hours", label: "Hours" },
  { value: "days", label: "Days" },
]

const WaitDurationFields = ({
  duration,
  onChange,
}: {
  duration?: WorkflowDelayDuration
  onChange: (next: WorkflowDelayDuration) => void
}) => {
  const matchedPresetId = matchDelayPresetId(duration)
  const custom = customFieldsFromDuration(duration)
  const [useCustom, setUseCustom] = useState(
    matchedPresetId === CUSTOM_DELAY_PRESET_ID
  )
  const isCustom = useCustom || matchedPresetId === CUSTOM_DELAY_PRESET_ID

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="wait-duration-preset">Wait for</Label>
        <Select
          value={isCustom ? CUSTOM_DELAY_PRESET_ID : matchedPresetId}
          onValueChange={(value) => {
            if (!value) return
            if (value === CUSTOM_DELAY_PRESET_ID) {
              setUseCustom(true)
              onChange(
                durationFromCustomAmount(custom.amount || 1, custom.unit)
              )
              return
            }
            setUseCustom(false)
            const preset = DELAY_DURATION_PRESETS.find(
              (item) => item.id === value
            )
            if (preset) onChange({ ...preset.duration })
          }}
        >
          <SelectTrigger id="wait-duration-preset" className="h-10 w-full">
            <SelectValue placeholder="Choose a duration" />
          </SelectTrigger>
          <SelectContent align="start" alignItemWithTrigger={false}>
            <SelectGroup>
              {DELAY_DURATION_PRESETS.map((preset) => (
                <SelectItem key={preset.id} value={preset.id}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectGroup>
            <SelectSeparator />
            <SelectItem value={CUSTOM_DELAY_PRESET_ID}>Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isCustom ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="wait-duration-amount">Time</Label>
            <Input
              id="wait-duration-amount"
              type="number"
              min={1}
              value={custom.amount || ""}
              onChange={(event) => {
                const amount = Number(event.target.value)
                onChange(
                  durationFromCustomAmount(
                    Number.isFinite(amount) ? amount : 0,
                    custom.unit
                  )
                )
              }}
              placeholder="Enter time"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wait-duration-unit">Unit</Label>
            <Select
              value={custom.unit}
              onValueChange={(value) => {
                if (!value) return
                onChange(
                  durationFromCustomAmount(
                    custom.amount || 1,
                    value as DelayDurationUnit
                  )
                )
              }}
            >
              <SelectTrigger id="wait-duration-unit" className="h-10 w-full">
                <SelectValue placeholder="Unit" />
              </SelectTrigger>
              <SelectContent align="start" alignItemWithTrigger={false}>
                {DELAY_UNITS.map((unit) => (
                  <SelectItem key={unit.value} value={unit.value}>
                    {unit.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : null}
    </div>
  )
}

const NodeDeleteButton = ({
  id,
  deletable = true,
}: {
  id: string
  deletable?: boolean
}) => {
  const { deleteElements } = useReactFlow()

  if (!deletable) return null

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      aria-label="Delete node"
      className="nodrag nopan absolute top-2 right-2 z-10 opacity-0 transition-opacity group-hover/node:opacity-100 text-muted-foreground hover:text-destructive"
      onClick={(event) => {
        event.stopPropagation()
        void deleteElements({ nodes: [{ id }] })
      }}
    >
      <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
    </Button>
  )
}

const NodeAddButton = ({ id }: { id: string }) => {
  const { requestAddAfter } = useCanvasActions()
  const isLeaf = useStore((state) => {
    return !state.edges.some((edge) => {
      if (edge.source !== id) return false
      const target = state.nodes.find((node) => node.id === edge.target)
      return Boolean(target && target.type !== "placeholder")
    })
  })

  if (!isLeaf) return null

  return (
    <div className="pointer-events-none absolute top-1/2 left-full z-10 flex -translate-y-1/2 items-center opacity-0 transition-opacity group-hover/node:opacity-100 group-focus-within/node:opacity-100">
      <span className="h-px w-5 bg-border" />
      <button
        type="button"
        aria-label="Add next block"
        className="nodrag nopan pointer-events-auto flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm"
        onClick={(event) => {
          event.stopPropagation()
          requestAddAfter(id)
        }}
      >
        <HugeiconsIcon icon={PlusSignIcon} size={12} strokeWidth={2.5} />
      </button>
    </div>
  )
}

const WorkflowBlockNode = ({
  id,
  data,
  selected,
  deletable,
  kind = "action",
  showTargetHandle = false,
}: {
  id: string
  data: WorkflowNodeData
  selected?: boolean
  deletable?: boolean
  kind?: "trigger" | "action"
  showTargetHandle?: boolean
}) => {
  const { openNodeConfig } = useCanvasActions()
  const isTrigger = kind === "trigger"

  return (
    <div className="group/node relative w-[300px]">
      {showTargetHandle ? (
        <Handle
          type="target"
          position={Position.Left}
          className="!-left-1.5 !size-2.5 !border-2 !border-violet-400 !bg-transparent"
        />
      ) : null}

      <Frame
        role="button"
        tabIndex={0}
        dense
        stacked
        spacing={"lg"}
        className={cn(
          "relative w-full cursor-pointer text-left shadow-sm !focus:outline-none",
          selected && "ring-2 ring-primary/40"
        )}
        onClick={(event) => {
          event.stopPropagation()
          openNodeConfig(id)
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            event.stopPropagation()
            openNodeConfig(id)
          }
        }}
      >
        <NodeDeleteButton id={id} deletable={deletable} />

        <FrameHeader className="pr-6">
          <span
            className={cn(
              "text-xs font-medium",
              isTrigger ? "text-violet-400" : "text-muted-foreground"
            )}
          >
            {isTrigger ? "Trigger" : "Action"}
          </span>

        </FrameHeader>

        <FramePanel fit className="flex h-20 shrink-0 flex-col justify-center">
          {isTrigger && isRecordTrigger(data.blockId) ? (
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs">{data.description}</p>
              <p
                className={cn(
                  "truncate text-sm mt-2 font-medium",
                  !data.objectLabel && "text-muted-foreground font-normal"
                )}
              >
                {data.objectLabel ?? "Select an object"}
              </p>
            </div>
          ) : isWaitAction(data.blockId) ? (
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs">{data.label}</p>
              <p
                className={cn(
                  "truncate text-sm mt-2 font-medium",
                  !isPositiveDelayDuration(data.delayDuration) &&
                    "text-muted-foreground font-normal"
                )}
              >
                {formatDelayDuration(data.delayDuration)}
              </p>
            </div>
          ) : isRecordWriteAction(data.blockId) ? (
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs">{data.label}</p>
              <p
                className={cn(
                  "truncate text-sm mt-2 font-medium",
                  !data.objectLabel && "text-muted-foreground font-normal"
                )}
              >
                {data.objectLabel ?? "Select an object"}
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              {data.description}
            </p>
          )}
        </FramePanel>
      </Frame>

      <Handle
        type="source"
        position={Position.Right}
        className="!-right-1.5 !size-2.5 !border-2 !border-violet-400 !bg-transparent"
      />

      <NodeAddButton id={id} />
    </div>
  )
}

const TriggerNode = ({
  id,
  data,
  selected,
  deletable,
}: NodeProps<TriggerFlowNode>) => {
  return (
    <WorkflowBlockNode
      id={id}
      data={data}
      selected={selected}
      deletable={deletable}
      kind="trigger"
    />
  )
}

const ActionNode = ({
  id,
  data,
  selected,
  deletable,
}: NodeProps<ActionFlowNode>) => {
  return (
    <WorkflowBlockNode
      id={id}
      data={data}
      selected={selected}
      deletable={deletable}
      showTargetHandle
    />
  )
}

const groupBlocks = (blocks: BlockDef[]) => {
  const groups = new Map<string, BlockDef[]>()
  for (const block of blocks) {
    const list = groups.get(block.category) ?? []
    list.push(block)
    groups.set(block.category, list)
  }
  return [...groups.entries()]
}

const PlaceholderNode = ({ id }: NodeProps<PlaceholderFlowNode>) => {
  const { selectBlockForPlaceholder, cancelPlaceholder } = useCanvasActions()
  const actionGroups = useMemo(() => groupBlocks(ACTION_BLOCKS), [])

  return (
    <div className="relative">
      <Handle
        type="target"
        position={Position.Left}
        className="!-left-1.5 !size-2.5 !border-border !bg-primary"
      />
      <div className="nodrag nopan nowheel w-72 overflow-hidden rounded-xl border border-border bg-popover shadow-md">
        <Command className="rounded-xl bg-transparent">
          <div className="flex items-center justify-between px-3 pt-3 pb-1">
            <p className="text-sm font-medium">Search blocks</p>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="Close"
              onClick={() => cancelPlaceholder(id)}
            >
              <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
            </Button>
          </div>
          <CommandInput placeholder="Search blocks..." />
          <CommandList>
            <CommandEmpty>No blocks found.</CommandEmpty>
            {actionGroups.map(([category, blocks]) => (
              <CommandGroup key={category} heading={category}>
                {blocks.map((block) => (
                  <CommandItem
                    key={block.id}
                    value={`${block.label} ${block.category}`}
                    onSelect={() => selectBlockForPlaceholder(id, block)}
                  >
                    {block.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </div>
    </div>
  )
}

const StartFromScratch = ({
  onSelectTrigger,
}: {
  onSelectTrigger: (block: BlockDef) => void
}) => {
  const triggerGroups = useMemo(() => groupBlocks(TRIGGER_BLOCKS), [])

  return (
    <div className="flex h-full w-full items-center justify-center">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              size="sm"
              variant="outline"
            />
          }
        >
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
          Move to...
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" side="bottom" className="w-72">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Triggers</DropdownMenuLabel>
            {triggerGroups.map(([category, blocks], index) => (
              <div key={category}>
                {index > 0 ? <DropdownMenuSeparator /> : null}
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                  {category}
                </DropdownMenuLabel>
                {blocks.map((block) => (
                  <DropdownMenuItem
                    key={block.id}
                    onClick={() => onSelectTrigger(block)}
                  >
                    {block.label}
                  </DropdownMenuItem>
                ))}
              </div>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

const ToolbarIconButton = ({
  label,
  icon,
  onClick,
  disabled,
  pressed,
}: {
  label: string
  icon: IconType
  onClick?: () => void
  disabled?: boolean
  pressed?: boolean
}) => {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label={label}
            aria-pressed={pressed}
            disabled={disabled}
            onClick={onClick}
            className={cn(pressed && "bg-muted")}
          />
        }
      >
        <HugeiconsIcon icon={icon} strokeWidth={2} />
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  )
}

const CanvasBottomToolbar = ({
  showMinimap,
  onToggleMinimap,
}: {
  showMinimap: boolean
  onToggleMinimap: () => void
}) => {
  const { zoomIn, zoomOut, fitView, getNodes, setNodes } = useReactFlow()

  const arrangeLayout = () => {
    const workflowNodes = getNodes()
      .filter((node) => node.type !== "placeholder")
      .sort((a, b) => a.position.x - b.position.x)

    const placeholders = getNodes().filter((node) => node.type === "placeholder")
    const nextWorkflow = workflowNodes.map((node, index) => ({
      ...node,
      position: {
        x: NODE_START_X + index * (NODE_WIDTH + NODE_GAP_X),
        y: NODE_Y,
      },
    }))

    const last = nextWorkflow[nextWorkflow.length - 1]
    const nextPlaceholders = placeholders.map((node) => ({
      ...node,
      position: {
        x: (last?.position.x ?? NODE_START_X) + NODE_WIDTH + NODE_GAP_X,
        y: NODE_Y,
      },
    }))

    setNodes([...nextWorkflow, ...nextPlaceholders])
    requestAnimationFrame(() => {
      void fitView({ padding: 0.35, duration: 200 })
    })
  }

  return (
    <ButtonGroup orientation="horizontal">
      
      <ButtonGroup>
        <ToolbarIconButton
          label="Undo"
          icon={ArrowTurnBackwardIcon}
          disabled
        />
        <ToolbarIconButton label="Redo" icon={ArrowTurnForwardIcon} disabled />
      </ButtonGroup>

      <ButtonGroup>
        <ToolbarIconButton
          label="Zoom out"
          icon={MinusSignIcon}
          onClick={() => zoomOut({ duration: 150 })}
        />
        <ToolbarIconButton
          label="Zoom in"
          icon={PlusSignIcon}
          onClick={() => zoomIn({ duration: 150 })}
        />
        <ToolbarIconButton
          label="Fit view"
          icon={FitToScreenIcon}
          onClick={() => {
            void fitView({ padding: 0.35, duration: 200 })
          }}
        />
      </ButtonGroup>

      <ButtonGroup>
        <ToolbarIconButton
          label="Auto layout"
          icon={LayoutGridIcon}
          onClick={arrangeLayout}
        />
        <ToolbarIconButton
          label={showMinimap ? "Hide minimap" : "Show minimap"}
          icon={MapsIcon}
          pressed={showMinimap}
          onClick={onToggleMinimap}
        />
      </ButtonGroup>
    </ButtonGroup>
  )
}

const initialNodes: WorkflowFlowNode[] = []
const initialEdges: Edge[] = []

const AutomationCanvas = ({
  workflowId,
  tab,
  onTabChange,
}: {
  workflowId?: string
  tab: WorkflowTab
  onTabChange: (tab: WorkflowTab) => void
}) => {
  const navigate = useNavigate()
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | undefined>(
    workflowId
  )
  const [workflowName, setWorkflowName] = useState("Untitled workflow")
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle")
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [showMinimap, setShowMinimap] = useState(false)
  const [configNodeId, setConfigNodeId] = useState<string | null>(null)
  const [objects, setObjects] = useState<DataObject[]>([])
  const [objectsLoading, setObjectsLoading] = useState(false)
  const [objectsError, setObjectsError] = useState<string | null>(null)
  const { data: activeOrganization } = authClient.useActiveOrganization()
  const organizationId = activeOrganization?.id
  const { fitView, getNode, getNodes } = useReactFlow()

  useEffect(() => {
    setCurrentWorkflowId(workflowId)
  }, [workflowId])

  useEffect(() => {
    if (!organizationId || !workflowId) return

    let cancelled = false
    void getWorkflow(organizationId, workflowId)
      .then((detail) => {
        if (cancelled) return
        setWorkflowName(detail.workflow.name ?? "Untitled workflow")
        if (detail.draftVersion?.trigger || detail.draftVersion?.steps) {
          const canvas = workflowDefinitionToCanvas(
            detail.draftVersion.trigger,
            detail.draftVersion.steps
          )
          setNodes(canvas.nodes as WorkflowFlowNode[])
          setEdges(canvas.edges)
          requestAnimationFrame(() => {
            void fitView({ padding: 0.35, duration: 200 })
          })
        }
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setSaveError(
          error instanceof Error ? error.message : "Failed to load workflow"
        )
      })

    return () => {
      cancelled = true
    }
  }, [fitView, organizationId, setEdges, setNodes, workflowId])

  const nodeTypes = useMemo(
    () => ({
      trigger: TriggerNode,
      action: ActionNode,
      placeholder: PlaceholderNode,
    }),
    []
  )

  const hasWorkflow = nodes.some(
    (node) => node.type === "trigger" || node.type === "action"
  )

  const deleteTarget = useMemo<WorkflowSummary | null>(() => {
    if (!currentWorkflowId) return null
    return {
      id: currentWorkflowId,
      name: workflowName,
      runs: 0,
      status: "DRAFT",
      draftVersionId: null,
      publishedVersionId: null,
      updatedAt: new Date().toISOString(),
    }
  }, [currentWorkflowId, workflowName])

  const configNode = useMemo(() => {
    if (!configNodeId) return null
    const node = nodes.find((item) => item.id === configNodeId)
    if (!node || (node.type !== "trigger" && node.type !== "action")) {
      return null
    }
    return node as TriggerFlowNode | ActionFlowNode
  }, [configNodeId, nodes])

  const configIsRecordTrigger =
    configNode?.type === "trigger" &&
    isRecordTrigger(configNode.data.blockId)

  const configIsCreateRecord =
    configNode?.type === "action" &&
    isCreateRecordAction(configNode.data.blockId)

  const configIsUpdateRecord =
    configNode?.type === "action" &&
    isUpdateRecordAction(configNode.data.blockId)

  const configIsRecordWrite = configIsCreateRecord || configIsUpdateRecord

  const configIsWait =
    configNode?.type === "action" && isWaitAction(configNode.data.blockId)

  const configNeedsObjects = configIsRecordTrigger || configIsRecordWrite

  const configSelectedObject = useMemo(
    () =>
      configNode?.data.objectId
        ? objects.find((object) => object.id === configNode.data.objectId)
        : undefined,
    [configNode?.data.objectId, objects]
  )

  const configObjectFields = useMemo(
    () => editableObjectFields(configSelectedObject?.fields ?? []),
    [configSelectedObject]
  )

  useEffect(() => {
    if (!configNeedsObjects || !organizationId) return

    let cancelled = false
    setObjectsLoading(true)
    setObjectsError(null)

    void listDataObjects(organizationId)
      .then((next) => {
        if (cancelled) return
        setObjects(next)
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setObjects([])
        setObjectsError(
          error instanceof Error ? error.message : "Failed to load objects"
        )
      })
      .finally(() => {
        if (!cancelled) setObjectsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [configNeedsObjects, organizationId])

  const selectTrigger = useCallback(
    (block: BlockDef) => {
      const id = `trigger-${crypto.randomUUID()}`
      const node: TriggerFlowNode = {
        id,
        type: "trigger",
        position: { x: NODE_START_X, y: NODE_Y },
        data: blockToNodeData(block),
        deletable: true,
      }
      setNodes([node])
      setEdges([])
      requestAnimationFrame(() => {
        void fitView({ padding: 0.4, duration: 200 })
      })
    },
    [fitView, setEdges, setNodes]
  )

  const requestAddAfter = useCallback(
    (sourceNodeId: string) => {
      const source = getNode(sourceNodeId)
      if (!source) return

      const placeholderId = `placeholder-${crypto.randomUUID()}`
      const placeholder: PlaceholderFlowNode = {
        id: placeholderId,
        type: "placeholder",
        position: {
          x: source.position.x + NODE_WIDTH + NODE_GAP_X,
          y: source.position.y,
        },
        data: { sourceNodeId },
        deletable: true,
      }

      const placeholderIds = new Set(
        getNodes()
          .filter((node) => node.type === "placeholder")
          .map((node) => node.id)
      )

      setNodes((current) => [
        ...current.filter((node) => node.type !== "placeholder"),
        placeholder,
      ])
      setEdges((current) => [
        ...current.filter(
          (edge) =>
            !placeholderIds.has(edge.source) && !placeholderIds.has(edge.target)
        ),
        createEdge(sourceNodeId, placeholderId),
      ])
      requestAnimationFrame(() => {
        void fitView({ padding: 0.35, duration: 200 })
      })
    },
    [fitView, getNode, getNodes, setEdges, setNodes]
  )

  const selectBlockForPlaceholder = useCallback(
    (placeholderId: string, block: BlockDef) => {
      const actionId = `action-${crypto.randomUUID()}`

      setNodes((current) =>
        current.map((node) => {
          if (node.id !== placeholderId) return node
          const next: ActionFlowNode = {
            id: actionId,
            type: "action",
            position: node.position,
            data: blockToNodeData(block),
            deletable: true,
          }
          return next
        })
      )
      setEdges((current) =>
        current.map((edge) => {
          if (edge.target === placeholderId) {
            return createEdge(edge.source, actionId)
          }
          if (edge.source === placeholderId) {
            return createEdge(actionId, edge.target)
          }
          return edge
        })
      )
      requestAnimationFrame(() => {
        void fitView({ padding: 0.35, duration: 200 })
      })
    },
    [fitView, setEdges, setNodes]
  )

  const cancelPlaceholder = useCallback(
    (placeholderId: string) => {
      setNodes((current) => current.filter((node) => node.id !== placeholderId))
      setEdges((current) =>
        current.filter(
          (edge) =>
            edge.source !== placeholderId && edge.target !== placeholderId
        )
      )
    },
    [setEdges, setNodes]
  )

  const openNodeConfig = useCallback((nodeId: string) => {
    setConfigNodeId(nodeId)
  }, [])

  const objectNameById = useMemo(
    () =>
      Object.fromEntries(
        objects.map((object) => [object.id, object.singularName.toLowerCase()])
      ),
    [objects]
  )

  const persistDraft = useCallback(async () => {
    if (!organizationId) {
      setSaveError("Select a workspace before saving")
      return null
    }

    setSaveState("saving")
    setSaveError(null)

    try {
      let targetWorkflowId = currentWorkflowId
      if (!targetWorkflowId) {
        const created = await createWorkflow(organizationId, workflowName)
        targetWorkflowId = created.workflow.id
        setCurrentWorkflowId(targetWorkflowId)
        navigate(`/automations/${targetWorkflowId}`, { replace: true })
      }

      const { trigger, steps } = canvasToWorkflowDefinition(
        getNodes(),
        edges,
        objectNameById
      )

      await saveWorkflowDraft(organizationId, targetWorkflowId, {
        name: workflowName,
        trigger,
        steps,
      })

      setSaveState("saved")
      return targetWorkflowId
    } catch (error) {
      setSaveState("error")
      setSaveError(error instanceof Error ? error.message : "Failed to save")
      return null
    }
  }, [
    currentWorkflowId,
    edges,
    getNodes,
    navigate,
    objectNameById,
    organizationId,
    workflowName,
  ])

  const handlePublish = useCallback(async () => {
    const savedId = await persistDraft()
    if (!savedId || !organizationId) return
    setIsPublishing(true)
    try {
      await publishWorkflow(organizationId, savedId)
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Failed to publish workflow"
      )
    } finally {
      setIsPublishing(false)
    }
  }, [organizationId, persistDraft])

  const handleRun = useCallback(async () => {
    if (!organizationId || !currentWorkflowId) {
      setSaveError("Save and publish the workflow before running")
      return
    }
    setIsRunning(true)
    try {
      await runWorkflow(organizationId, currentWorkflowId, {
        manual: true,
        triggeredAt: new Date().toISOString(),
      })
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to run")
    } finally {
      setIsRunning(false)
    }
  }, [currentWorkflowId, organizationId])

  const updateConfigNodeData = useCallback(
    (
      patch: Partial<
        Pick<
          WorkflowNodeData,
          | "label"
          | "description"
          | "objectId"
          | "objectLabel"
          | "objectNameSingular"
          | "fieldValues"
          | "delayDuration"
          | "incomplete"
        >
      >
    ) => {
      if (!configNodeId) return
      setNodes((current) =>
        current.map((node) => {
          if (node.id !== configNodeId) return node
          if (node.type !== "trigger" && node.type !== "action") return node
          const nextData = {
            ...node.data,
            ...patch,
          }
          if (isRecordObjectBlock(nextData.blockId)) {
            nextData.incomplete = !nextData.objectId
          }
          if (isWaitAction(nextData.blockId)) {
            nextData.incomplete = !isPositiveDelayDuration(
              nextData.delayDuration
            )
            nextData.description = formatDelayDuration(nextData.delayDuration)
          }
          return {
            ...node,
            data: nextData,
          }
        })
      )
    },
    [configNodeId, setNodes]
  )

  const updateConfigFieldValue = useCallback(
    (fieldName: string, value: string | number | boolean | null) => {
      if (!configNode) return
      updateConfigNodeData({
        fieldValues: {
          ...configNode.data.fieldValues,
          [fieldName]: value,
        },
      })
    },
    [configNode, updateConfigNodeData]
  )

  const canvasActions = useMemo<CanvasActions>(
    () => ({
      requestAddAfter,
      selectBlockForPlaceholder,
      cancelPlaceholder,
      openNodeConfig,
    }),
    [
      cancelPlaceholder,
      openNodeConfig,
      requestAddAfter,
      selectBlockForPlaceholder,
    ]
  )

  return (
    <CanvasActionsContext.Provider value={canvasActions}>
      <div className="relative h-full w-full bg-muted/20">
        {!hasWorkflow ? (
          <div className="absolute inset-0 z-10">
            <StartFromScratch onSelectTrigger={selectTrigger} />
          </div>
        ) : null}

        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          fitViewOptions={{ padding: 0.35 }}
          proOptions={{ hideAttribution: true }}
          deleteKeyCode={["Backspace", "Delete"]}
          defaultEdgeOptions={{
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 16,
              height: 16,
            },
            style: { strokeWidth: 1 },
          }}
          nodesConnectable={false}
          edgesReconnectable={false}
        >
          <Background gap={18} size={1} style={{ opacity: 0.1 }} />
          {showMinimap ? (
            <MiniMap
              pannable
              zoomable
              className="!overflow-hidden !rounded-lg !border !border-border !bg-card"
            />
          ) : null}
          <Panel position="top-left">
            <ButtonGroup>
              <ButtonGroup orientation="vertical">
              <ButtonGroup orientation="vertical" className="hidden sm:flex">
                  <Button variant="outline" size="icon-sm" aria-label="Fit">
                    <HugeiconsIcon icon={ArrowLeft02FreeIcons} />
                  </Button>
                </ButtonGroup>


                <ButtonGroup orientation="vertical" className="hidden sm:flex">
                  <Button variant="outline" size="icon-sm" aria-label="Fit">
                    <HugeiconsIcon icon={FocusPointFreeIcons} />
                  </Button>
                </ButtonGroup>
                <ButtonGroup orientation="vertical">
                  <Button size="icon-sm" variant="outline">
                    <HugeiconsIcon icon={PlusSignFreeIcons} />
                  </Button>
                  <Button size="icon-sm" variant="outline">
                    <HugeiconsIcon icon={MinusSignIcon} />
                  </Button>
                </ButtonGroup>
                <ButtonGroup>
                  <Button size="icon-sm" variant="outline">
                    <HugeiconsIcon icon={ClockIcon} />
                  </Button>
                </ButtonGroup>
              </ButtonGroup>
            </ButtonGroup>
          </Panel>
          <Panel position="top-center">
            <WorkflowTabBar tab={tab} onTabChange={onTabChange} />
          </Panel>
          <Panel position="top-right">
            <ButtonGroup className="**:data-[slot=button]:border-r-0">
              {currentWorkflowId ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  Delete
                </Button>
              ) : null}
              <Button
                variant="outline"
                size="sm"
                disabled={saveState === "saving"}
                onClick={() => {
                  void persistDraft()
                }}
              >
                {saveState === "saving" ? "Saving..." : "Save draft"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={isPublishing}
                onClick={() => {
                  void handlePublish()
                }}
              >
                {isPublishing ? "Publishing..." : "Publish"}
              </Button>
            </ButtonGroup>
            {saveError ? (
              <p className="mt-2 max-w-xs text-right text-xs text-destructive">
                {saveError}
              </p>
            ) : null}
          </Panel>
          <Panel position="bottom-center">
            <CanvasBottomToolbar
              showMinimap={showMinimap}
              onToggleMinimap={() => setShowMinimap((open) => !open)}
            />
          </Panel>
        </ReactFlow>

        <Dialog
          open={Boolean(configNode)}
          onOpenChange={(open) => {
            if (!open) setConfigNodeId(null)
          }}
        >
          <DialogContent className="flex max-h-[90%] w-[min(720px,calc(100%-2rem))] max-w-[min(720px,calc(100%-2rem))] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(720px,calc(100%-2rem))]">
            {configNode ? (
              <>
                <DialogHeader className="shrink-0 border-b border-border px-6 py-5">
                  <DialogTitle>{configNode.data.label}</DialogTitle>
                  <DialogDescription>
                    Configure this block for your automation.
                  </DialogDescription>
                </DialogHeader>
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
                  {configNeedsObjects ? (
                    <div className="space-y-2">
                      <Label htmlFor="node-config-object">Object</Label>
                      <Select
                        value={configNode.data.objectId}
                        onValueChange={(value) => {
                          if (!value) return
                          const selected = objects.find(
                            (object) => object.id === value
                          )
                          updateConfigNodeData({
                            objectId: value,
                            objectLabel:
                              selected?.singularName ??
                              selected?.pluralName ??
                              value,
                            objectNameSingular: selected?.singularName
                              ? selected.singularName.toLowerCase()
                              : undefined,
                            fieldValues: configIsRecordWrite ? {} : undefined,
                          })
                        }}
                        disabled={objectsLoading || !organizationId}
                      >
                        <SelectTrigger
                          id="node-config-object"
                          className="h-10 w-full"
                        >
                          <SelectValue
                            placeholder={
                              objectsLoading
                                ? "Loading objects..."
                                : "Select an object"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent
                          align="start"
                          alignItemWithTrigger={false}
                        >
                          {objects.map((object) => (
                            <SelectItem key={object.id} value={object.id}>
                              {object.singularName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {objectsError ? (
                        <p className="text-sm text-destructive">
                          {objectsError}
                        </p>
                      ) : null}
                      {!objectsLoading &&
                        !objectsError &&
                        organizationId &&
                        objects.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No objects found. Create one in Data model settings.
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {configIsRecordWrite && configSelectedObject ? (
                    <div className="space-y-4 border-t border-border pt-4">
                      <div>
                        <p className="text-sm font-medium">Record fields</p>
                        <p className="text-sm text-muted-foreground">
                          {configIsUpdateRecord
                            ? `Set values to update on the ${configSelectedObject.singularName.toLowerCase()} record.`
                            : `Set values for the new ${configSelectedObject.singularName.toLowerCase()} record.`}
                        </p>
                      </div>
                      {configObjectFields.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          This object has no editable fields.
                        </p>
                      ) : (
                        configObjectFields.map((field) => (
                          <RecordFieldInput
                            key={field.id}
                            field={field}
                            value={
                              configNode.data.fieldValues?.[field.key] ??
                              configNode.data.fieldValues?.[field.name]
                            }
                            onChange={(next) =>
                              updateConfigFieldValue(field.key, next)
                            }
                          />
                        ))
                      )}
                    </div>
                  ) : null}

                  {configIsWait ? (
                    <WaitDurationFields
                      duration={
                        configNode.data.delayDuration ?? DEFAULT_DELAY_DURATION
                      }
                      onChange={(delayDuration) =>
                        updateConfigNodeData({ delayDuration })
                      }
                    />
                  ) : null}

                  {configIsRecordTrigger ? null : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="node-config-title">Title</Label>
                        <Input
                          id="node-config-title"
                          value={configNode.data.label}
                          onChange={(event) =>
                            updateConfigNodeData({ label: event.target.value })
                          }
                          placeholder="Block title"
                        />
                      </div>
                      {configIsWait ? null : (
                        <div className="space-y-2">
                          <Label htmlFor="node-config-description">
                            Description
                          </Label>
                          <Textarea
                            id="node-config-description"
                            value={configNode.data.description}
                            onChange={(event) =>
                              updateConfigNodeData({
                                description: event.target.value,
                              })
                            }
                            placeholder="Describe what this block does"
                            rows={4}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            ) : null}
          </DialogContent>
        </Dialog>

        <DeleteWorkflowDialog
          workflow={deleteTarget}
          organizationId={organizationId}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          onDeleted={() => navigate("/automations", { replace: true })}
        />
      </div>
    </CanvasActionsContext.Provider>
  )
}

const NewAutomationPage = () => {
  const { workflowId } = useParams<{ workflowId?: string }>()
  const [tab, setTab] = useState<WorkflowTab>("editor")

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1">
        {tab === "editor" ? (
          <ReactFlowProvider>
            <AutomationCanvas
              workflowId={workflowId}
              tab={tab}
              onTabChange={setTab}
            />
          </ReactFlowProvider>
        ) : tab === "executions" ? (
          <WorkflowExecutions
            workflowId={workflowId}
            tab={tab}
            onTabChange={setTab}
          />
        ) : (
          <div className="relative flex h-full items-center justify-center bg-muted/20 px-6 text-center">
            <div className="absolute top-3 left-1/2 z-10 -translate-x-1/2">
              <WorkflowTabBar tab={tab} onTabChange={setTab} />
            </div>
            <div>
              <p className="text-sm font-medium">Evaluations coming soon</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Test cases and scoring for this automation will show up here.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default NewAutomationPage
