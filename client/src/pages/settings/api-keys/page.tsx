import { FormEvent, useCallback, useEffect, useState } from "react"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { apiKey, authClient } from "@/lib/auth-client"

const ORG_KEY_CONFIG_ID = "org-keys"

type ApiKeyRow = {
  id: string
  name: string | null
  start?: string | null
  prefix?: string | null
  enabled?: boolean
  createdAt: string | Date
  expiresAt?: string | Date | null
}

const formatDate = (value: string | Date | null | undefined) => {
  if (!value) return "Never"
  const date = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

const ApiKeysSettingsPage = () => {
  const { data: activeOrganization } = authClient.useActiveOrganization()
  const [keys, setKeys] = useState<ApiKeyRow[]>([])
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const organizationId = activeOrganization?.id

  const loadKeys = useCallback(async () => {
    if (!organizationId) {
      setKeys([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: listError } = await apiKey.list({
      query: {
        configId: ORG_KEY_CONFIG_ID,
        organizationId,
      },
    })

    if (listError) {
      setError(listError.message ?? "Failed to load API keys")
      setKeys([])
      setLoading(false)
      return
    }

    const rows = Array.isArray(data)
      ? data
      : ((data as { apiKeys?: ApiKeyRow[] } | null)?.apiKeys ?? [])

    setKeys(rows as ApiKeyRow[])
    setLoading(false)
  }, [organizationId])

  useEffect(() => {
    void loadKeys()
  }, [loadKeys])

  const resetModal = () => {
    setName("")
    setCreatedKey(null)
    setCopied(false)
    setCreating(false)
  }

  const onModalOpenChange = (open: boolean) => {
    setModalOpen(open)
    if (!open) {
      // Drop the plaintext key from memory/UI as soon as the modal closes.
      resetModal()
    }
  }

  const openCreateModal = () => {
    resetModal()
    setError(null)
    setModalOpen(true)
  }

  const onCreate = async (event: FormEvent) => {
    event.preventDefault()
    if (!organizationId || !name.trim()) return

    setCreating(true)
    setError(null)

    const { data, error: createError } = await apiKey.create({
      configId: ORG_KEY_CONFIG_ID,
      organizationId,
      name: name.trim(),
    })

    if (createError) {
      setError(createError.message ?? "Failed to create API key")
      setCreating(false)
      return
    }

    const keyValue = (data as { key?: string } | null)?.key ?? null
    if (!keyValue) {
      setError("API key was created but the secret was not returned.")
      setCreating(false)
      await loadKeys()
      return
    }

    setCreatedKey(keyValue)
    setName("")
    setCreating(false)
    await loadKeys()
  }

  const onCopy = async () => {
    if (!createdKey) return
    await navigator.clipboard.writeText(createdKey)
    setCopied(true)
  }

  const onDelete = async (keyId: string) => {
    setDeletingId(keyId)
    setError(null)

    const { error: deleteError } = await apiKey.delete({
      configId: ORG_KEY_CONFIG_ID,
      keyId,
    })

    if (deleteError) {
      setError(deleteError.message ?? "Failed to revoke API key")
      setDeletingId(null)
      return
    }

    setDeletingId(null)
    await loadKeys()
  }

  if (!organizationId) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto p-12">
        <p className="text-sm text-muted-foreground">
          Select a workspace to manage API keys.
        </p>
      </div>
    )
  }

  return (
    <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto p-12">
      <div className="flex w-full max-w-4xl flex-col gap-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">API Keys</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Create and revoke workspace API keys for{" "}
              {activeOrganization?.name ?? "this organization"}.
            </p>
          </div>
          <Button type="button" onClick={openCreateModal}>
            Create key
          </Button>
        </div>

        {error && !modalOpen ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : null}

        <section className="space-y-4">
          <div>
            <h2 className="text-base font-medium">Your keys</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Only the key prefix is stored for display. The full secret is shown
              once at creation.
            </p>
          </div>

          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Prefix</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground">
                      Loading API keys...
                    </TableCell>
                  </TableRow>
                ) : keys.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground">
                      No API keys yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  keys.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell className="font-medium">
                        {key.name || "Untitled"}
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground">
                        {key.start || key.prefix || "elw_"}…
                      </TableCell>
                      <TableCell>{formatDate(key.createdAt)}</TableCell>
                      <TableCell>{formatDate(key.expiresAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={deletingId === key.id}
                          onClick={() => void onDelete(key.id)}
                        >
                          {deletingId === key.id ? "Revoking..." : "Revoke"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>

      <Dialog open={modalOpen} onOpenChange={onModalOpenChange}>
        <DialogContent className="sm:max-w-lg" showCloseButton={!creating}>
          {createdKey ? (
            <>
              <DialogHeader>
                <DialogTitle>Copy your API key</DialogTitle>
                <DialogDescription>
                  This is the only time the full key is shown. Store it somewhere
                  safe before you close this dialog.
                </DialogDescription>
              </DialogHeader>

              <code className="block break-all rounded-md border border-border bg-muted/40 px-3 py-3 text-sm">
                {createdKey}
              </code>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => void onCopy()}>
                  {copied ? "Copied" : "Copy"}
                </Button>
                <Button type="button" onClick={() => onModalOpenChange(false)}>
                  Done
                </Button>
              </DialogFooter>
            </>
          ) : (
            <form onSubmit={onCreate} className="grid gap-6">
              <DialogHeader>
                <DialogTitle>Create API key</DialogTitle>
                <DialogDescription>
                  Name this key so your team can tell it apart later.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-2">
                <Label htmlFor="api-key-name">Name</Label>
                <Input
                  id="api-key-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Production server"
                  autoFocus
                  required
                  disabled={creating}
                />
              </div>

              {error ? <p className="text-sm text-destructive">{error}</p> : null}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  disabled={creating}
                  onClick={() => onModalOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={creating || !name.trim()}>
                  {creating ? "Creating..." : "Create key"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ApiKeysSettingsPage
