import { Navigate } from "react-router"
import { ReactNode } from "react"
import { useAuthStore } from "@/stores/useAuthStore"

/**
 * ✅ Protege rutas con JWT.
 * - Si no hay token o expiró → redirige a /login.
 * - Si es válido → muestra el contenido.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { token, isTokenValid } = useAuthStore()

  if (!token || !isTokenValid()) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
