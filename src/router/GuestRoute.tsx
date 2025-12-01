import { Navigate } from "react-router";
import { ReactNode } from "react";
import { useAuthStore } from "@/stores/useAuthStore";

/**
 * ✅ Solo para usuarios NO autenticados (Invitados).
 * - Si YA tiene token válido → lo patea al dashboard (/reservas).
 * - Si NO tiene token → le deja ver el login.
 */
export function GuestRoute({ children }: { children: ReactNode }) {
  const { token, isTokenValid } = useAuthStore();

  // Si existe token y es válido, redirigimos al dashboard
  if (token && isTokenValid()) {
    return <Navigate to="/reservas" replace />;
  }

  return <>{children}</>;
}