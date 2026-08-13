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
import { deleteObjectRecord, type ObjectRecord } from "@/api/records"
import type { DataObject } from "@/api/data-model"

type DeleteRecordDialogProps = {
  object: DataObject
  record: ObjectRecord | null
  organizationId: string | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted?: () => void
}

export const DeleteRecordDialog = ({
  object,
  record,
  organizationId,
  open,
  onOpenChange,
  onDeleted,
}: DeleteRecordDialogProps) => {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setDeleting(false)
      setError(null)
    }
  }, [open])

  const handleDelete = useCallback(async () => {
    if (!organizationId || !record) return
    setDeleting(true)
    setError(null)
    try {
      await deleteObjectRecord(organizationId, object.id, record.id)
      onOpenChange(false)
      onDeleted?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete record")
      setDeleting(false)
    }
  }, [object.id, onDeleted, onOpenChange, organizationId, record])

  if (!record) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete this {object.singularName.toLowerCase()}?</DialogTitle>
          <DialogDescription>
            This removes the record from {object.pluralName.toLowerCase()}.
            Automations that watch for deletes will still run.
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
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
