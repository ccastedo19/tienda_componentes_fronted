import { Navigate } from "react-router-dom"

import { useAuth } from "@/hooks/use-auth"
import { Login } from "@/pages/Login"

export function GuestRoute() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/inicio" replace />
  }

  return <Login />
}
