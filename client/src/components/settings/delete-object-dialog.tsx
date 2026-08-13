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
import { deleteDataObject, type DataObject } from "@/api/data-model"

type DeleteObjectDialogProps = {
  object: DataObject | null
  organizationId: string | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted?: () => void
}

export const DeleteObjectDialog = ({
  object,
  organizationId,
  open,
  onOpenChange,
  onDeleted,
}: DeleteObjectDialogProps) => {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setDeleting(false)
      setError(null)
    }
  }, [open])

  const handleDelete = useCallback(async () => {
    if (!organizationId || !object) return
    setDeleting(true)
    setError(null)
    try {
      await deleteDataObject(organizationId, object.id)
      onOpenChange(false)
      onDeleted?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete object")
      setDeleting(false)
    }
  }, [object, onDeleted, onOpenChange, organizationId])

  if (!object) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete {object.pluralName}?</DialogTitle>
          <DialogDescription>
            This removes the object from your workspace, drops its database
            table, and deletes all {object.records} record
            {object.records === 1 ? "" : "s"}. This cannot be undone.
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
            {deleting ? "Deleting..." : "Delete object"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
