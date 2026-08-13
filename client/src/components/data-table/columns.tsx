import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowUpDownIcon } from "@hugeicons/core-free-icons"

export function SortableHeader({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="-ml-2 h-8 gap-1.5"
      onClick={onClick}
    >
      {label}
      <HugeiconsIcon icon={ArrowUpDownIcon} className="size-3.5 opacity-50" />
    </Button>
  )
}

export function StatusBadge({
  status,
  tone = "secondary",
}: {
  status: string
  tone?: "default" | "secondary" | "outline" | "destructive"
}) {
  return <Badge variant={tone}>{status}</Badge>
}

export type { ColumnDef }
