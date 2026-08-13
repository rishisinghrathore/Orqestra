import { type FormEvent, useEffect, useMemo, useState } from "react"
import { Link, Navigate, useNavigate, useParams } from "react-router-dom"
import {
  USER_FIELD_TYPES,
  createDataObjectField,
  deleteDataObjectField,
  getDataObject,
  updateDataObject,
  updateDataObjectField,
  type DataObject,
  type DataObjectField,
  type SelectOption,
} from "@/api/data-model"
import { DeleteObjectDialog } from "@/components/settings/delete-object-dialog"
import { authClient } from "@/lib/auth-client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Frame, FramePanel } from "@/components/reui/frame"

const ObjectDetailPage = () => {
  const navigate = useNavigate()
  const { objectId } = useParams<{ objectId: string }>()
  const { data: activeOrganization } = authClient.useActiveOrganization()
  const organizationId = activeOrganization?.id
  const [object, setObject] = useState<DataObject | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [missing, setMissing] = useState(false)
  const [fieldQuery, setFieldQuery] = useState("")
  const [relationQuery, setRelationQuery] = useState("")
  const [fieldDialogMode, setFieldDialogMode] = useState<"add" | "edit" | null>(
    null
  )
  const [editingField, setEditingField] = useState<DataObjectField | null>(null)
  const [deleteFieldTarget, setDeleteFieldTarget] =
    useState<DataObjectField | null>(null)
  const [deletingField, setDeletingField] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)

  const reload = async () => {
    if (!organizationId || !objectId) return
    const next = await getDataObject(organizationId, objectId)
    setObject(next)
  }

  useEffect(() => {
    if (!organizationId || !objectId) {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)
    setMissing(false)

    getDataObject(organizationId, objectId)
      .then((next) => {
        if (!cancelled) setObject(next)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const message =
          err instanceof Error ? err.message : "Failed to load object"
        if (/not found/i.test(message)) {
          setMissing(true)
        } else {
          setError(message)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [objectId, organizationId])

  const fields = useMemo(() => {
    if (!object) return []
    const normalized = fieldQuery.trim().toLowerCase()
    const filtered = !normalized
      ? object.fields
      : object.fields.filter((field) =>
          field.name.toLowerCase().includes(normalized)
        )
    return [...filtered].sort((a, b) => a.name.localeCompare(b.name))
  }, [fieldQuery, object])

  const relations = useMemo(() => {
    if (!object) return []
    const normalized = relationQuery.trim().toLowerCase()
    const filtered = !normalized
      ? object.relations
      : object.relations.filter((relation) =>
          relation.name.toLowerCase().includes(normalized)
        )
    return [...filtered].sort((a, b) => a.name.localeCompare(b.name))
  }, [object, relationQuery])

  if (!objectId || missing) {
    return <Navigate to="/settings/data-model" replace />
  }

  if (loading && !object) {
    return (
      <div className="p-12 text-sm text-muted-foreground">Loading object...</div>
    )
  }

  if (!object) {
    return (
      <div className="p-12 text-sm text-destructive">
        {error || "Object not found"}
      </div>
    )
  }

  const handleSettingsBlur = async () => {
    if (!organizationId) return
    setSavingSettings(true)
    setError(null)
    try {
      const next = await updateDataObject(organizationId, object.id, {
        singularName: object.singularName,
        pluralName: object.pluralName,
        description: object.description,
      })
      setObject(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save object")
    } finally {
      setSavingSettings(false)
    }
  }

  const handleConfirmDeleteField = async () => {
    if (!organizationId || !deleteFieldTarget) return
    setDeletingField(true)
    setError(null)
    try {
      await deleteDataObjectField(organizationId, deleteFieldTarget.id)
      setDeleteFieldTarget(null)
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete field")
    } finally {
      setDeletingField(false)
    }
  }

  return (
    <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto p-12">
      <div className="flex w-full max-w-4xl flex-col gap-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {object.pluralName}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {object.description ||
                `Manage fields and relations for ${object.pluralName}.`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {object.app === "custom" ? (
              <Button
                type="button"
                variant="destructive"
                onClick={() => setDeleteOpen(true)}
              >
                Delete
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              render={<Link to="/settings/data-model" />}
            >
              Back
            </Button>
          </div>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Tabs defaultValue="fields">
          <TabsList>
            <TabsTrigger value="fields">Fields</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="layout">Layout</TabsTrigger>
          </TabsList>

          <TabsContent value="fields" className="mt-8 space-y-10">
            <section className="space-y-4">
              <div>
                <h2 className="text-base font-medium">Relations</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Relation between this object and other objects.
                </p>
              </div>

              <Input
                value={relationQuery}
                onChange={(event) => setRelationQuery(event.target.value)}
                placeholder="Search a field..."
                className="sm:max-w-sm"
              />

              <Frame spacing={"xs"}>
                <FramePanel className="!p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>App</TableHead>
                        <TableHead>Type</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {relations.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={3}
                            className="text-muted-foreground"
                          >
                            No relations found
                          </TableCell>
                        </TableRow>
                      ) : (
                        relations.map((relation) => (
                          <TableRow key={relation.id}>
                            <TableCell>{relation.name}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="capitalize">
                                {relation.app}
                              </Badge>
                            </TableCell>
                            <TableCell>{relation.type}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </FramePanel>
              </Frame>
            </section>

            <section className="space-y-4">
              <div>
                <h2 className="text-base font-medium">Fields</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Customise the fields available in the {object.pluralName}{" "}
                  views and their display order in the {object.pluralName}{" "}
                  detail view and menus.
                </p>
              </div>

              <Input
                value={fieldQuery}
                onChange={(event) => setFieldQuery(event.target.value)}
                placeholder="Search a field..."
                className="sm:max-w-sm"
              />

              <Frame spacing={"xs"}>
                <FramePanel className="!p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>App</TableHead>
                        <TableHead>Data type</TableHead>
                        <TableHead className="w-40" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-muted-foreground"
                          >
                            No fields found
                          </TableCell>
                        </TableRow>
                      ) : (
                        fields.map((field) => (
                          <TableRow key={field.id}>
                            <TableCell>{field.name}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="capitalize">
                                {field.app}
                              </Badge>
                            </TableCell>
                            <TableCell>{field.dataType}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                {!field.isSystem ? (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setEditingField(field)
                                      setFieldDialogMode("edit")
                                    }}
                                  >
                                    Edit
                                  </Button>
                                ) : null}
                                {field.isCustom ? (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDeleteFieldTarget(field)}
                                  >
                                    Delete
                                  </Button>
                                ) : null}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </FramePanel>
              </Frame>

              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={() => {
                    setEditingField(null)
                    setFieldDialogMode("add")
                  }}
                >
                  Add field
                </Button>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="settings" className="mt-8 space-y-4">
            <div>
              <h2 className="text-base font-medium">Settings</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Update the name and description for this object.
                {savingSettings ? " Saving..." : ""}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="object-singular">Singular name</Label>
                <Input
                  id="object-singular"
                  value={object.singularName}
                  onChange={(event) => {
                    setObject({
                      ...object,
                      singularName: event.target.value,
                    })
                  }}
                  onBlur={() => void handleSettingsBlur()}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="object-plural">Plural name</Label>
                <Input
                  id="object-plural"
                  value={object.pluralName}
                  onChange={(event) => {
                    setObject({
                      ...object,
                      pluralName: event.target.value,
                    })
                  }}
                  onBlur={() => void handleSettingsBlur()}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="object-description">Description</Label>
              <Textarea
                id="object-description"
                value={object.description}
                onChange={(event) => {
                  setObject({
                    ...object,
                    description: event.target.value,
                  })
                }}
                onBlur={() => void handleSettingsBlur()}
                rows={5}
              />
            </div>

            {object.app === "custom" ? (
              <section className="space-y-3 border-t pt-6">
                <div>
                  <h3 className="text-base font-medium text-destructive">
                    Danger zone
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Permanently delete this object, its fields, and all records.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  Delete object
                </Button>
              </section>
            ) : null}
          </TabsContent>

          <TabsContent value="layout" className="mt-8">
            <div>
              <h2 className="text-base font-medium">Layout</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Layout settings for {object.pluralName} are coming soon.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <FieldDialog
        mode={fieldDialogMode}
        field={editingField}
        onOpenChange={(open) => {
          if (!open) {
            setFieldDialogMode(null)
            setEditingField(null)
          }
        }}
        onSubmit={async (input) => {
          if (!organizationId) return
          if (fieldDialogMode === "edit" && editingField) {
            await updateDataObjectField(organizationId, editingField.id, {
              label: input.name,
              options: input.options,
            })
          } else {
            await createDataObjectField(organizationId, object.id, input)
          }
          await reload()
        }}
      />

      <Dialog
        open={deleteFieldTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteFieldTarget(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete {deleteFieldTarget?.name}?</DialogTitle>
            <DialogDescription>
              This removes the field from the object and drops its column from
              the database table. Existing values in that column will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={deletingField}
              onClick={() => setDeleteFieldTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deletingField}
              onClick={() => void handleConfirmDeleteField()}
            >
              {deletingField ? "Deleting..." : "Delete field"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteObjectDialog
        object={object}
        organizationId={organizationId}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={() => navigate("/settings/data-model", { replace: true })}
      />
    </div>
  )
}

const FieldDialog = ({
  mode,
  field,
  onOpenChange,
  onSubmit,
}: {
  mode: "add" | "edit" | null
  field: DataObjectField | null
  onOpenChange: (open: boolean) => void
  onSubmit: (input: {
    name: string
    type: string
    options?: SelectOption[]
  }) => Promise<void>
}) => {
  const open = mode !== null
  const isEdit = mode === "edit"
  const [name, setName] = useState("")
  const [type, setType] = useState("TEXT")
  const [optionsText, setOptionsText] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    if (isEdit && field) {
      setName(field.name)
      setType(field.type || "TEXT")
      setOptionsText(
        (field.options ?? []).map((option) => option.label).join("\n")
      )
    } else {
      setName("")
      setType("TEXT")
      setOptionsText("")
    }
    setError(null)
    setSaving(false)
  }, [field, isEdit, open])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    const trimmed = name.trim()
    if (!trimmed) {
      setError("Field name is required")
      return
    }

    const options =
      type === "SELECT"
        ? optionsText
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean)
            .map((label) => ({
              value: label.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
              label,
            }))
        : undefined

    if (type === "SELECT" && (!options || options.length === 0)) {
      setError("Add at least one option (one per line)")
      return
    }

    setSaving(true)
    try {
      await onSubmit({ name: trimmed, type, options })
      onOpenChange(false)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isEdit
            ? "Failed to update field"
            : "Failed to add field"
      )
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="grid gap-6">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit field" : "Add field"}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Update the field label. The data type cannot be changed after creation."
                : "This adds a column to the object table in the workspace schema."}
            </DialogDescription>
          </DialogHeader>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="space-y-2">
            <Label htmlFor="field-name">Name</Label>
            <Input
              id="field-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Phone"
              autoComplete="off"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="field-type">Type</Label>
            {isEdit ? (
              <Input id="field-type" value={type} disabled readOnly />
            ) : (
              <Select
                value={type}
                onValueChange={(value) => {
                  if (value) setType(value)
                }}
              >
                <SelectTrigger id="field-type" className="h-10 w-full">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent align="start" alignItemWithTrigger={false}>
                  {USER_FIELD_TYPES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {type === "SELECT" ? (
            <div className="space-y-2">
              <Label htmlFor="field-options">Options</Label>
              <Textarea
                id="field-options"
                value={optionsText}
                onChange={(event) => setOptionsText(event.target.value)}
                placeholder={"Active\nInactive"}
                rows={4}
              />
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default ObjectDetailPage
