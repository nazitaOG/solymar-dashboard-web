// src/lib/api/fetchAPI.ts
import { useAuthStore } from "@/stores/useAuthStore"

/**
 * ✅ Fetch universal con manejo avanzado de errores
 * - Inyecta token JWT fresco (si no es endpoint público)
 * - Traduce códigos HTTP a mensajes amigables
 * - Loguea el error en consola solo en desarrollo
 * - Devuelve JSON tipado <T>
 */

const PUBLIC_ENDPOINTS = ["/auth/login", "/auth/register", "/auth/forgot-password"]

// 💡 Tabla de mensajes para errores comunes
const FRIENDLY_MESSAGES: Record<number, string> = {
  400: "Solicitud inválida.",
  401: "Email o contraseña incorrectos.",
  403: "No tenés permisos para acceder.",
  404: "Recurso no encontrado.",
  422: "Datos incompletos o inválidos.",
  500: "Ocurrió un error en el servidor. Intenta más tarde.",
}

export async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const { getValidToken, logout } = useAuthStore.getState()

  const isPublic = PUBLIC_ENDPOINTS.some((p) => endpoint.startsWith(p))
  const token = isPublic ? null : await getValidToken()

  const res = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  })

  // ⚠️ Manejo avanzado de errores HTTP
  if (!res.ok) {
    // Caso especial: token expirado
    if (res.status === 401 && !isPublic) {
      logout()
      throw new Error("Sesión expirada. Volvé a iniciar sesión.")
    }

    // 1️⃣ Intentar obtener mensaje del backend
    let backendMessage = ""
    try {
      const data = await res.json()
      backendMessage =
        (Array.isArray(data.message)
          ? data.message.join(", ")
          : data.message) ||
        data.error ||
        ""
    } catch {
      backendMessage = await res.text()
    }

    // 2️⃣ Buscar mensaje amigable según código
    const friendly = FRIENDLY_MESSAGES[res.status]
    const message =
      backendMessage && import.meta.env.DEV
      ? `${friendly ?? backendMessage} (${backendMessage})`
      : (friendly ?? (backendMessage || `Error ${res.status}`))


    // 3️⃣ Log de diagnóstico en modo dev
    if (import.meta.env.DEV) {
      console.warn(`❌ API Error (${res.status}) → ${endpoint}`, message)
    }

    throw new Error(message)
  }

  // ✅ Si todo salió bien, devolvemos JSON tipado
  return res.json() as Promise<T>
}
