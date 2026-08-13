import { useCallback, useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { deleteWorkflow, type WorkflowSummary } from "@/api/workflow"

type DeleteWorkflowDialogProps = {
  workflow: WorkflowSummary | null
  organizationId: string | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted?: () => void
}

export const DeleteWorkflowDialog = ({
  workflow,
  organizationId,
  open,
  onOpenChange,
  onDeleted,
}: DeleteWorkflowDialogProps) => {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setDeleting(false)
      setError(null)
    }
  }, [open])

  const handleDelete = useCallback(async () => {
    if (!organizationId || !workflow) return
    setDeleting(true)
    setError(null)
    try {
      await deleteWorkflow(organizationId, workflow.id)
      onOpenChange(false)
      onDeleted?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete workflow")
      setDeleting(false)
    }
  }, [onDeleted, onOpenChange, organizationId, workflow])

  if (!workflow) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete {workflow.name ?? "Untitled workflow"}?</DialogTitle>
          <DialogDescription>
            This removes the workflow, its versions, and any automated triggers.
            Run history is kept, but the workflow will no longer execute.
          </DialogDescription>
        </DialogHeader>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={deleting}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={deleting}
            onClick={() => void handleDelete()}
          >
            {deleting ? "Deleting..." : "Delete workflow"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
