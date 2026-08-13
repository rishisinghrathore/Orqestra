import { useCallback, useEffect, useMemo, useState } from "react"
import { Navigate, useParams } from "react-router-dom"
import { getDataObject, type DataObject } from "@/api/data-model"
import { listObjectRecords, type ObjectRecord } from "@/api/records"
import { CreateRecordDialog } from "@/components/records/create-record-dialog"
import { DeleteRecordDialog } from "@/components/records/delete-record-dialog"
import { editableObjectFields } from "@/components/records/record-field-input"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Frame, FramePanel } from "@/components/reui/frame"
import { IconStack } from "@/components/reui/icon-stack"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, DatabaseIcon } from "@hugeicons/core-free-icons"

const ObjectRecordsPage = () => {
  const { objectId } = useParams<{ objectId: string }>()
  const { data: activeOrganization } = authClient.useActiveOrganization()
  const organizationId = activeOrganization?.id
  const [object, setObject] = useState<DataObject | null>(null)
  const [records, setRecords] = useState<ObjectRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [recordsLoading, setRecordsLoading] = useState(true)
  const [missing, setMissing] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ObjectRecord | null>(null)
  const [recordsError, setRecordsError] = useState<string | null>(null)

  const reloadObject = useCallback(async () => {
    if (!organizationId || !objectId) return
    const next = await getDataObject(organizationId, objectId)
    setObject(next)
  }, [objectId, organizationId])

  const reloadRecords = useCallback(async () => {
    if (!organizationId || !objectId) return
    setRecordsLoading(true)
    setRecordsError(null)
    try {
      const next = await listObjectRecords(organizationId, objectId)
      setRecords(next)
    } catch (error) {
      setRecords([])
      setRecordsError(
        error instanceof Error ? error.message : "Failed to load records"
      )
    } finally {
      setRecordsLoading(false)
    }
  }, [objectId, organizationId])

  useEffect(() => {
    if (!organizationId || !objectId) {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setMissing(false)

    getDataObject(organizationId, objectId)
      .then((next) => {
        if (!cancelled) setObject(next)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        if (err instanceof Error && /not found/i.test(err.message)) {
          setMissing(true)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [objectId, organizationId])

  useEffect(() => {
    if (!organizationId || !objectId) return
    void reloadRecords()
  }, [objectId, organizationId, reloadRecords])

  const displayFields = useMemo(
    () => (object ? editableObjectFields(object.fields) : []),
    [object]
  )

  const handleRecordCreated = useCallback(async () => {
    await Promise.all([reloadObject(), reloadRecords()])
  }, [reloadObject, reloadRecords])

  const handleRecordDeleted = useCallback(async () => {
    await Promise.all([reloadObject(), reloadRecords()])
  }, [reloadObject, reloadRecords])

  if (!objectId || missing) {
    return <Navigate to="/" replace />
  }

  if (loading || !object) {
    return (
      <div className="p-12 text-sm text-muted-foreground">Loading...</div>
    )
  }

  const isEmpty =
    !recordsLoading && !recordsError && records.length === 0

  const dialogs = (
    <>
      <CreateRecordDialog
        object={object}
        organizationId={organizationId}
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          void handleRecordCreated()
        }}
      />
      <DeleteRecordDialog
        object={object}
        record={deleteTarget}
        organizationId={organizationId}
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        onDeleted={() => {
          void handleRecordDeleted()
        }}
      />
    </>
  )

  if (isEmpty) {
    return (
      <>
        <div className="no-scrollbar flex min-h-0 flex-1 items-center justify-center overflow-y-auto p-12">
          <Empty className="max-w-md py-10">
            <EmptyHeader>
              <EmptyMedia>
                <IconStack
                  aria-hidden="true"
                  className="h-24 w-22 text-primary"
                >
                  <HugeiconsIcon
                    icon={DatabaseIcon}
                    strokeWidth={2}
                    className="size-5 text-primary"
                  />
                </IconStack>
              </EmptyMedia>
              <EmptyTitle>
                No {object.pluralName.toLowerCase()} yet
              </EmptyTitle>
              <EmptyDescription>
                Create your first {object.singularName.toLowerCase()} to get
                started.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                type="button"
                size="sm"
                onClick={() => setCreateOpen(true)}
              >
                <HugeiconsIcon
                  icon={Add01Icon}
                  strokeWidth={2}
                  data-icon="inline-start"
                />
                Create {object.singularName}
              </Button>
            </EmptyContent>
          </Empty>
        </div>
        {dialogs}
      </>
    )
  }

  return (
    <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto p-12">
      <div className="flex w-full max-w-5xl flex-col gap-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {object.pluralName}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {object.description ||
                `Browse and manage ${object.pluralName.toLowerCase()}.`}
            </p>
          </div>
          <Button type="button" onClick={() => setCreateOpen(true)}>
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
            Create {object.singularName}
          </Button>
        </div>

        <Frame spacing="xs">
          <FramePanel className="!p-0">
            {recordsError ? (
              <p className="p-6 text-sm text-destructive">{recordsError}</p>
            ) : recordsLoading ? (
              <p className="p-6 text-sm text-muted-foreground">
                Loading records...
              </p>
            ) : (
              <Table className="table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead>Created</TableHead>
                    {displayFields.map((field) => (
                      <TableHead key={field.id}>{field.name}</TableHead>
                    ))}
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="text-muted-foreground">
                        {new Date(record.createdAt).toLocaleString()}
                      </TableCell>
                      {displayFields.map((field) => (
                        <TableCell key={field.id}>
                          {formatCellValue(record.fields[field.name])}
                        </TableCell>
                      ))}
                      <TableCell>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(record)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </FramePanel>
        </Frame>
      </div>

      {dialogs}
    </div>
  )
}

const formatCellValue = (value: unknown) => {
  if (value == null || value === "") return "—"
  if (typeof value === "boolean") return value ? "Yes" : "No"
  if (value instanceof Date) return value.toLocaleString()
  return String(value)
}

export default ObjectRecordsPage
