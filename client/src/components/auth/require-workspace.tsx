import { useEffect, useState } from "react"
import { Navigate, Outlet, useLocation } from "react-router-dom"
import { organization } from "@/lib/auth-client"

const RequireWorkspace = () => {
  const location = useLocation()
  const [checking, setChecking] = useState(true)
  const [hasWorkspace, setHasWorkspace] = useState(false)

  useEffect(() => {
    let cancelled = false

    const ensureActiveWorkspace = async () => {
      const { data: orgs, error } = await organization.list()

      if (cancelled) return

      if (error || !orgs || orgs.length === 0) {
        setHasWorkspace(false)
        setChecking(false)
        return
      }

      const { data: active } = await organization.getFullOrganization()

      if (cancelled) return

      if (!active) {
        const first = orgs[0]
        await organization.setActive({
          organizationId: first.id,
        })
      }

      if (cancelled) return

      setHasWorkspace(true)
      setChecking(false)
    }

    void ensureActiveWorkspace()

    return () => {
      cancelled = true
    }
  }, [location.pathname])

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading workspace...</p>
      </div>
    )
  }

  if (!hasWorkspace) {
    return <Navigate to="/create-workspace" replace />
  }

  return <Outlet />
}

export default RequireWorkspace
