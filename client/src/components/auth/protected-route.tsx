import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useSession } from "@/lib/auth-client"

const ProtectedRoute = () => {
  const location = useLocation()
  const { data: session, isPending } = useSession()

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Checking session...</p>
      </div>
    )
  }

  if (!session) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    )
  }

  return <Outlet />
}

export default ProtectedRoute
