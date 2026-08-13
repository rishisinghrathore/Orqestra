import { FormEvent, useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient, organization, useSession } from "@/lib/auth-client"

const BrandMark = ({ className }: { className?: string }) => {
  return (
    <svg
      fill="none"
      className={className}
      height="48"
      viewBox="0 0 36 48"
      width="36"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="m0 6c10.1433 9.4404 25.8567 9.4404 36 0-9.4404 10.1433-9.4404 25.8567 0 36-10.1433-9.4404-25.8567-9.4404-36 0 9.44041-10.1433 9.44041-25.8567 0-36z"
        fill="currentColor"
      />
    </svg>
  )
}

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

const CreateWorkspacePage = () => {
  const navigate = useNavigate()
  const { data: session, isPending: sessionPending } = useSession()
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [slugTouched, setSlugTouched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  const previewSlug = useMemo(
    () => (slugTouched ? slug : toSlug(name)),
    [name, slug, slugTouched]
  )

  useEffect(() => {
    if (sessionPending) return

    if (!session) {
      navigate("/login", { replace: true })
      return
    }

    let cancelled = false

    const checkOrganizations = async () => {
      const { data, error: listError } = await organization.list()
      if (cancelled) return

      if (listError) {
        setError(listError.message ?? "Failed to load workspaces")
        setChecking(false)
        return
      }

      if (data && data.length > 0) {
        navigate("/", { replace: true })
        return
      }

      setChecking(false)
    }

    void checkOrganizations()

    return () => {
      cancelled = true
    }
  }, [navigate, session, sessionPending])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const nextName = name.trim()
    const nextSlug = previewSlug.trim()
    if (!nextName || !nextSlug || loading) return

    setLoading(true)
    setError(null)

    const { data, error: createError } = await organization.create({
      name: nextName,
      slug: nextSlug,
    })

    if (createError || !data) {
      setError(createError?.message ?? "Failed to create workspace")
      setLoading(false)
      return
    }

    await organization.setActive({ organizationId: data.id })
    navigate("/", { replace: true })
  }

  if (sessionPending || checking) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-background px-6">
        <p className="text-sm text-muted-foreground">Loading workspace setup...</p>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-16">
      <div aria-hidden className="login-backdrop pointer-events-none absolute inset-0" />
      <div
        aria-hidden
        className="login-grid pointer-events-none absolute inset-0 opacity-35 dark:opacity-20"
      />
      <div
        aria-hidden
        className="login-orb pointer-events-none absolute -top-24 left-1/2 size-[34rem] -translate-x-1/2 rounded-full bg-[oklch(0.82_0.06_200/0.35)] blur-3xl dark:bg-[oklch(0.45_0.08_200/0.28)]"
      />

      <div className="login-panel relative z-10 w-full max-w-md">
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="login-mark text-foreground">
            <BrandMark className="size-14" />
          </div>
          <h1 className="mt-6 font-heading text-4xl font-semibold tracking-tight text-foreground">
            Elasticware
          </h1>
          <p className="mt-2 max-w-xs text-base text-muted-foreground">
            Create your first sales workspace to get started.
          </p>
        </div>

        <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
          <div className="space-y-2">
            <Label htmlFor="workspace-name" className="sr-only">
              Workspace name
            </Label>
            <Input
              id="workspace-name"
              type="text"
              placeholder="Workspace name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="workspace-slug" className="sr-only">
              Workspace slug
            </Label>
            <Input
              id="workspace-slug"
              type="text"
              placeholder="workspace-slug"
              value={previewSlug}
              onChange={(event) => {
                setSlugTouched(true)
                setSlug(toSlug(event.target.value))
              }}
              required
            />
            <p className="text-xs text-muted-foreground">
              Your workspace URL will use this slug.
            </p>
          </div>

          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}

          <Button
            type="submit"
            disabled={loading || !name.trim() || !previewSlug}
            className="w-full"
          >
            {loading ? "Creating..." : "Create workspace"}
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Signed in as{" "}
          <span className="font-medium text-foreground">
            {session?.user.email}
          </span>
          .{" "}
          <button
            type="button"
            className="font-medium text-foreground underline-offset-4 hover:underline"
            onClick={() => {
              void authClient.signOut({
                fetchOptions: {
                  onSuccess: () => navigate("/login"),
                },
              })
            }}
          >
            Sign out
          </button>
        </p>

        <p className="mt-3 text-center text-sm text-muted-foreground">
          <Link
            to="/"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Skip for now
          </Link>
        </p>
      </div>
    </div>
  )
}

export default CreateWorkspacePage
