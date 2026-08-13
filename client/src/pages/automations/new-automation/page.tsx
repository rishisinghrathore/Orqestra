import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ComponentProps,
} from "react"
import { useNavigate } from "react-router-dom"
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
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
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
import { Textarea } from "@/components/ui/textarea"
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
import { cn } from "@/lib/utils"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  Alert02Icon,
  ArrowTurnBackwardIcon,
  ArrowTurnForwardIcon,
  Delete02Icon,
  FitToScreenIcon,
  FocusPointFreeIcons,
  LayoutGridIcon,
  MapsIcon,
  MinusSignIcon,
  PlusSignFreeIcons,
  PlusSignIcon,
  ClockIcon,
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
  {
    id: "record-merged",
    kind: "trigger",
    label: "Record merged",
    description: "When records are merged",
    category: "Records",
  },
  {
    id: "manual",
    kind: "trigger",
    label: "Manual trigger",
    description: "Run this workflow manually",
    category: "General",
  },
  {
    id: "schedule",
    kind: "trigger",
    label: "Schedule",
    description: "Run on a recurring schedule",
    category: "General",
  },
  {
    id: "webhook",
    kind: "trigger",
    label: "Webhook received",
    description: "When a webhook is received",
    category: "General",
  },
  {
    id: "form-submitted",
    kind: "trigger",
    label: "Form submitted",
    description: "When a form is submitted",
    category: "Forms",
  },
  {
    id: "email-received",
    kind: "trigger",
    label: "Email received",
    description: "When an email is received",
    category: "Communication",
  },
  {
    id: "message-received",
    kind: "trigger",
    label: "Message received",
    description: "When a chat message is received",
    category: "Communication",
  },
]

const ACTION_BLOCKS: BlockDef[] = [
  {
    id: "custom-agent",
    kind: "action",
    label: "Custom agent",
    description: "Run a custom agent",
    category: "Agents",
  },
  {
    id: "research-agent",
    kind: "action",
    label: "Research agent",
    description: "Research a topic with an agent",
    category: "Agents",
  },
  {
    id: "classify-record",
    kind: "action",
    label: "Classify record",
    description: "Classify a record with AI",
    category: "AI",
  },
  {
    id: "summarize-record",
    kind: "action",
    label: "Summarize record",
    description: "Summarize a record with AI",
    category: "AI",
  },
  {
    id: "run-prompt",
    kind: "action",
    label: "Run prompt",
    description: "Run an AI prompt",
    category: "AI",
  },
  {
    id: "extract-fields",
    kind: "action",
    label: "Extract fields",
    description: "Extract structured fields with AI",
    category: "AI",
  },
  {
    id: "create-record",
    kind: "action",
    label: "Create record",
    description: "Create a new record",
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
    id: "find-people",
    kind: "action",
    label: "Find people",
    description: "Look up people records",
    category: "Records",
  },
  {
    id: "find-companies",
    kind: "action",
    label: "Find companies",
    description: "Look up company records",
    category: "Records",
  },
  {
    id: "assign-owner",
    kind: "action",
    label: "Assign owner",
    description: "Assign a user as owner",
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
}

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
  description: block.description,
  incomplete: true,
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
  showTriggerBadge = false,
  showTargetHandle = false,
}: {
  id: string
  data: WorkflowNodeData
  selected?: boolean
  deletable?: boolean
  showTriggerBadge?: boolean
  showTargetHandle?: boolean
}) => {
  const { openNodeConfig } = useCanvasActions()

  return (
    <div className="group/node relative w-[300px]">
      {showTriggerBadge ? (
        <div className="absolute bottom-full left-0 inline-flex items-center gap-1.5 rounded-t-md bg-violet-500/15 px-2.5 py-1 text-xs font-medium text-violet-400">
          Trigger
        </div>
      ) : null}

      {showTargetHandle ? (
        <Handle
          type="target"
          position={Position.Left}
          className="!-left-1.5 !size-2.5 !border-2 !border-violet-400 !bg-transparent"
        />
      ) : null}

      <div
        role="button"
        tabIndex={0}
        className={cn(
          "relative flex min-h-10 w-full cursor-pointer items-center rounded-xl border border-border/70 bg-card px-3 py-2 text-left shadow-sm",
          showTriggerBadge && "rounded-tl-none",
          selected && "ring-2 ring-card"
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

        <div className="flex min-w-0 flex-1 items-center gap-2 pr-6">
          <p className="truncate text-sm font-medium text-foreground">
            {data.label}
          </p>
          {data.incomplete ? (
            <HugeiconsIcon
              icon={Alert02Icon}
              size={14}
              strokeWidth={2}
              className="shrink-0 text-destructive"
            />
          ) : null}
        </div>
      </div>

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
      showTriggerBadge
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
              size="lg"
              variant="outline"
              className="h-12 gap-2 rounded-md px-6 text-base shadow-sm"
            />
          }
        >
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
          Start from scratch
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

const AutomationCanvas = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [showMinimap, setShowMinimap] = useState(false)
  const [configNodeId, setConfigNodeId] = useState<string | null>(null)
  const { fitView, getNode, getNodes } = useReactFlow()

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

  const configNode = useMemo(() => {
    if (!configNodeId) return null
    const node = nodes.find((item) => item.id === configNodeId)
    if (!node || (node.type !== "trigger" && node.type !== "action")) {
      return null
    }
    return node as TriggerFlowNode | ActionFlowNode
  }, [configNodeId, nodes])

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

  const updateConfigNodeData = useCallback(
    (patch: Partial<Pick<WorkflowNodeData, "label" | "description">>) => {
      if (!configNodeId) return
      setNodes((current) =>
        current.map((node) => {
          if (node.id !== configNodeId) return node
          if (node.type !== "trigger" && node.type !== "action") return node
          return {
            ...node,
            data: {
              ...node.data,
              ...patch,
            },
          }
        })
      )
    },
    [configNodeId, setNodes]
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
          <Panel position="center-right" className="  "></Panel>
          <Panel position="top-left">
            <ButtonGroup>
              <ButtonGroup orientation="vertical">
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
            <ButtonGroup>
              <Button variant="secondary" size="sm">
                Editor
              </Button>
              <Button variant="secondary" size="sm">
                Executions
              </Button>
              <Button variant="secondary" size="sm">
                Evaluations
              </Button>
            </ButtonGroup>
          </Panel>
          <Panel position="top-right"></Panel>
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
                  <div className="space-y-2">
                    <Label htmlFor="node-config-description">Description</Label>
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
                </div>
              </>
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </CanvasActionsContext.Provider>
  )
}

const NewAutomationPage = () => {
  const navigate = useNavigate()
  const [tab] = useState("workflow")

  const close = () => navigate("/automations")

  return (
    <Dialog open onOpenChange={(open) => !open && close()}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "flex h-full min-h-full w-full min-w-full max-w-full flex-col rounded-none p-0"
        )}
      >
        <div className="min-h-0 flex-1">
          {tab === "workflow" ? (
            <ReactFlowProvider>
              <AutomationCanvas />
            </ReactFlowProvider>
          ) : (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <p className="text-sm font-medium">No runs yet</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                When this automation executes, run history will show up here.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default NewAutomationPage
