import { type FormEvent, useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { createDataObject } from "@/api/data-model"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const pluralize = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) return ""
  if (/[sxz]$/i.test(trimmed) || /[cs]h$/i.test(trimmed)) {
    return `${trimmed}es`
  }
  if (/[^aeiou]y$/i.test(trimmed)) {
    return `${trimmed.slice(0, -1)}ies`
  }
  if (/s$/i.test(trimmed)) return trimmed
  return `${trimmed}s`
}

const NewObjectPage = () => {
  const navigate = useNavigate()
  const { data: activeOrganization } = authClient.useActiveOrganization()
  const organizationId = activeOrganization?.id
  const [singular, setSingular] = useState("")
  const [plural, setPlural] = useState("")
  const [description, setDescription] = useState("")
  const [pluralTouched, setPluralTouched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!pluralTouched) {
      setPlural(pluralize(singular))
    }
  }, [singular, pluralTouched])

  const close = () => navigate("/settings/data-model")

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!organizationId) {
      setError("Select a workspace first")
      return
    }

    const singularName = singular.trim()
    const pluralName = plural.trim()

    if (!singularName) {
      setError("Singular name is required")
      return
    }
    if (!pluralName) {
      setError("Plural name is required")
      return
    }

    setSaving(true)
    try {
      const created = await createDataObject(organizationId, {
        singularName,
        pluralName,
        description: description.trim(),
      })
      navigate(`/settings/data-model/${created.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create object")
      setSaving(false)
    }
  }

  return (
    <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto p-12">
      <form
        onSubmit={onSubmit}
        className="flex w-full max-w-4xl flex-col gap-10"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              New object
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Define how this object appears across your workspace.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              render={<Link to="/settings/data-model" />}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !organizationId}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <section className="space-y-4">
          <div>
            <h2 className="text-base font-medium">About</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Define the name and description of your object.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="object-singular">Singular name</Label>
              <Input
                id="object-singular"
                value={singular}
                onChange={(event) => setSingular(event.target.value)}
                placeholder="Listing"
                autoComplete="off"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="object-plural">Plural name</Label>
              <Input
                id="object-plural"
                value={plural}
                onChange={(event) => {
                  setPluralTouched(true)
                  setPlural(event.target.value)
                }}
                placeholder="Listings"
                autoComplete="off"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="object-description">Description</Label>
            <Textarea
              id="object-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Write a description"
              rows={5}
            />
          </div>
        </section>

        <div className="flex justify-end gap-2 sm:hidden">
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={close}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving || !organizationId}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default NewObjectPage
