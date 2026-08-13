import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { listDataObjects, type DataObject } from "@/api/data-model"
import { DeleteObjectDialog } from "@/components/settings/delete-object-dialog"
import { authClient } from "@/lib/auth-client"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, DatabaseIcon } from "@hugeicons/core-free-icons"
import { Frame, FramePanel } from "@/components/reui/frame"
import { IconStack } from "@/components/reui/icon-stack"

const DataModelSettingsPage = () => {
  const navigate = useNavigate()
  const { data: activeOrganization } = authClient.useActiveOrganization()
  const organizationId = activeOrganization?.id
  const [query, setQuery] = useState("")
  const [objects, setObjects] = useState<DataObject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DataObject | null>(null)

  const reload = async () => {
    if (!organizationId) return
    const next = await listDataObjects(organizationId)
    setObjects(next)
  }

  useEffect(() => {
    if (!organizationId) {
      setObjects([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    listDataObjects(organizationId)
      .then((next) => {
        if (!cancelled) setObjects(next)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load objects")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [organizationId])

  const filteredObjects = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    const next = !normalized
      ? objects
      : objects.filter((object) =>
          object.pluralName.toLowerCase().includes(normalized)
        )

    return [...next].sort((a, b) => a.pluralName.localeCompare(b.pluralName))
  }, [objects, query])

  const isEmpty = !loading && !error && objects.length === 0

  const deleteDialog = (
    <DeleteObjectDialog
      object={deleteTarget}
      organizationId={organizationId}
      open={deleteTarget !== null}
      onOpenChange={(open) => {
        if (!open) setDeleteTarget(null)
      }}
      onDeleted={() => {
        setDeleteTarget(null)
        void reload()
      }}
    />
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
              <EmptyTitle>No objects yet</EmptyTitle>
              <EmptyDescription>
                Add your first object to start modelling records, fields, and
                relationships.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                type="button"
                size="sm"
                render={<Link to="/settings/data-model/new" />}
              >
                <HugeiconsIcon
                  icon={Add01Icon}
                  strokeWidth={2}
                  data-icon="inline-start"
                />
                Add object
              </Button>
            </EmptyContent>
          </Empty>
        </div>
        {deleteDialog}
      </>
    )
  }

  return (
    <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto p-12">
      <div className="flex w-full max-w-4xl flex-col gap-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Data models</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Manage objects, fields and relationships.
            </p>
          </div>

          <Button
            type="button"
            render={<Link to="/settings/data-model/new" />}
          >
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
            Add object
          </Button>
        </div>

        <section className="space-y-4">
          <div>
            <h2 className="text-base font-medium">Objects</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Customise the objects available in the workspace.
            </p>
          </div>

          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search for an object..."
            className="sm:max-w-sm"
          />

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Frame spacing={"xs"}>
            <FramePanel className="!p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>App</TableHead>
                    <TableHead>Fields</TableHead>
                    <TableHead>Records</TableHead>
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-muted-foreground">
                        Loading objects...
                      </TableCell>
                    </TableRow>
                  ) : filteredObjects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-muted-foreground">
                        {query.trim()
                          ? "No objects match your search."
                          : "No objects in this workspace yet."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredObjects.map((object) => (
                      <TableRow
                        key={object.id}
                        className="cursor-pointer"
                        onClick={() =>
                          navigate(`/settings/data-model/${object.id}`)
                        }
                      >
                        <TableCell>{object.pluralName}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {object.app}
                          </Badge>
                        </TableCell>
                        <TableCell>{object.fields.length}</TableCell>
                        <TableCell>{object.records}</TableCell>
                        <TableCell className="text-right">
                          {object.app === "custom" ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={(event) => {
                                event.stopPropagation()
                                setDeleteTarget(object)
                              }}
                            >
                              Delete
                            </Button>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </FramePanel>
          </Frame>
        </section>
      </div>

      {deleteDialog}
    </div>
  )
}

export default DataModelSettingsPage
