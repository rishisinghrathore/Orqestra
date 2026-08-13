import { useMemo, useState, useSyncExternalStore } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getDataObjects, subscribeDataObjects } from "@/lib/data-model"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon } from "@hugeicons/core-free-icons"
import { Frame, FramePanel } from "@/components/reui/frame"

const useDataObjects = () =>
  useSyncExternalStore(subscribeDataObjects, getDataObjects, getDataObjects)

const DataModelSettingsPage = () => {
  const navigate = useNavigate()
  const objects = useDataObjects()
  const [query, setQuery] = useState("")

  const filteredObjects = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    const next = !normalized
      ? objects
      : objects.filter((object) =>
        object.pluralName.toLowerCase().includes(normalized)
      )

    return [...next].sort((a, b) =>
      a.pluralName.localeCompare(b.pluralName)
    )
  }, [objects, query])

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

          <Frame spacing={'xs'}>
            <FramePanel className="!p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>App</TableHead>
                    <TableHead>Fields</TableHead>
                    <TableHead>Records</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredObjects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-muted-foreground">
                        No objects match your search.
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
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

            </FramePanel>
          </Frame>
        </section>
      </div>
    </div>
  )
}

export default DataModelSettingsPage
