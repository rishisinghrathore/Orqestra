import { useEffect, useMemo, useState, type FormEvent } from "react"
import type { DataObject } from "@/api/data-model"
import { createObjectRecord } from "@/api/records"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  editableObjectFields,
  RecordFieldInput,
} from "@/components/records/record-field-input"

type CreateRecordDialogProps = {
  object: DataObject
  organizationId?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}

export const CreateRecordDialog = ({
  object,
  organizationId,
  open,
  onOpenChange,
  onCreated,
}: CreateRecordDialogProps) => {
  const [fieldValues, setFieldValues] = useState<
    Record<string, string | number | boolean | null>
  >({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const editableFields = useMemo(
    () => editableObjectFields(object.fields),
    [object.fields]
  )

  useEffect(() => {
    if (!open) return
    setFieldValues({})
    setError(null)
    setSaving(false)
  }, [open, object.id])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!organizationId) {
      setError("Select a workspace before creating a record")
      return
    }

    setSaving(true)
    setError(null)

    try {
      const payload = Object.fromEntries(
        editableFields
          .map((field) => [field.key, fieldValues[field.id] ?? null] as const)
          .filter(([, value]) => value !== null && value !== "")
      )

      await createObjectRecord(organizationId, object.id, payload)
      onCreated()
      onOpenChange(false)
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to create record"
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90%] w-[min(720px,calc(100%-2rem))] max-w-[min(720px,calc(100%-2rem))] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(720px,calc(100%-2rem))]">
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogHeader className="shrink-0 border-b border-border px-6 py-5">
            <DialogTitle>Create {object.singularName}</DialogTitle>
            <DialogDescription>
              Add a new {object.singularName.toLowerCase()} record to this object.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            {editableFields.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                This object has no editable fields. The record will be created
                with default values only.
              </p>
            ) : (
              editableFields.map((field) => (
                <RecordFieldInput
                  key={field.id}
                  field={field}
                  value={fieldValues[field.id]}
                  onChange={(next) =>
                    setFieldValues((current) => ({
                      ...current,
                      [field.id]: next,
                    }))
                  }
                />
              ))
            )}
          </div>

          <DialogFooter className="shrink-0 border-t border-border px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !organizationId}>
              {saving ? "Creating..." : `Create ${object.singularName}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
