// src/lib/api/fetchAPI.ts
import { useAuthStore } from "@/stores/useAuthStore"

/**
 * ✅ Fetch autenticado con token fresco.
 * - Hace refresh si el JWT está por expirar.
 * - Lanza errores HTTP como excepciones.
 * - Devuelve JSON parseado con tipo genérico <T>.
 */
export async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const { getValidToken, logout } = useAuthStore.getState()
  const token = await getValidToken()

  if (!token) {
    logout()
    throw new Error("Sesión expirada. Volvé a iniciar sesión.")
  }

  const res = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
    ...options,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Error ${res.status} en ${endpoint}`)
  }

  return res.json() as Promise<T>
}
