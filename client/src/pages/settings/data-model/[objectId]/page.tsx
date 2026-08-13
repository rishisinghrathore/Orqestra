import { useMemo, useState, useSyncExternalStore } from "react"
import { Link, Navigate, useParams } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import {
  getDataObject,
  subscribeDataObjects,
  updateDataObject,
} from "@/lib/data-model"

const useDataObject = (objectId: string | undefined) =>
  useSyncExternalStore(
    subscribeDataObjects,
    () => (objectId ? getDataObject(objectId) : null),
    () => (objectId ? getDataObject(objectId) : null)
  )

const ObjectDetailPage = () => {
  const { objectId } = useParams<{ objectId: string }>()
  const object = useDataObject(objectId)
  const [fieldQuery, setFieldQuery] = useState("")
  const [relationQuery, setRelationQuery] = useState("")

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

  if (!objectId || !object) {
    return <Navigate to="/settings/data-model" replace />
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
          <Button
            type="button"
            variant="outline"
            render={<Link to="/settings/data-model" />}
          >
            Back
          </Button>
        </div>

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

              <div className="rounded-lg border border-border">
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
              </div>

              <div className="flex justify-end">
                <Button type="button" variant="outline">
                  Add relation
                </Button>
              </div>
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

              <div className="rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>App</TableHead>
                      <TableHead>Data type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={3}
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
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end">
                <Button type="button" variant="outline">
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
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="object-singular">Singular name</Label>
                <Input
                  id="object-singular"
                  value={object.singularName}
                  onChange={(event) => {
                    updateDataObject(object.id, {
                      singularName: event.target.value,
                    })
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="object-plural">Plural name</Label>
                <Input
                  id="object-plural"
                  value={object.pluralName}
                  onChange={(event) => {
                    updateDataObject(object.id, {
                      pluralName: event.target.value,
                    })
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="object-description">Description</Label>
              <Textarea
                id="object-description"
                value={object.description}
                onChange={(event) => {
                  updateDataObject(object.id, {
                    description: event.target.value,
                  })
                }}
                rows={5}
              />
            </div>
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
    </div>
  )
}

export default ObjectDetailPage
