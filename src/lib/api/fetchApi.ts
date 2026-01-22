import { useAuthStore } from "@/stores/useAuthStore"

/**
 * ✅ Fetch universal con manejo avanzado de errores
 * - Inyecta token JWT fresco (si no es endpoint público)
 * - Prioriza mensajes del backend para lógica de negocio
 * - Traduce códigos HTTP a mensajes amigables si el backend calla
 * - Devuelve JSON tipado <T>
 */
function cleanPayload<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(item => cleanPayload(item)) as unknown as T;
  }

  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([, v]) => v !== "" && v !== null && v !== undefined)
        .map(([k, v]) => [k, cleanPayload(v)])
    ) as unknown as T;
  }

  return obj;
}

const PUBLIC_ENDPOINTS = ["/auth/login", "/auth/register", "/auth/forgot-password"]

// 💡 Tabla de mensajes para errores comunes (fallback)
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

  if (options.body && typeof options.body === "string") {
    try {
      const parsedBody: unknown = JSON.parse(options.body);
      const cleanedBody = cleanPayload(parsedBody);
      options.body = JSON.stringify(cleanedBody);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error parsing/cleaning body:", error);
      }
    }
  }
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

  if (!res.ok) {
    if (res.status === 401 && !isPublic) {
      logout()
      throw new Error("Sesión expirada. Volvé a iniciar sesión.")
    }

    let backendMessage = ""
    try {
      const data = await res.json()
      // 🛡️ Blindaje total: buscamos el mensaje en cualquier propiedad común de Nest/Prisma
      backendMessage =
        (Array.isArray(data.message) ? data.message.join(", ") : data.message) ||
        data.error?.message ||
        data.error ||
        ""
    } catch {
      try { backendMessage = await res.text() } catch { backendMessage = "" }
    }

    const friendly = FRIENDLY_MESSAGES[res.status]

    // 🚀 PRIORIDAD: Si el backend habló (P0001 de Postgres), usamos eso. 
    // Solo si backendMessage está vacío usamos el friendly.
    const message = (backendMessage && backendMessage.trim().length > 0)
      ? backendMessage
      : (friendly || `Error ${res.status}`);

    if (import.meta.env.DEV) {
      console.warn(`❌ API Error (${res.status}) → ${endpoint}`, message);
    }

    throw new Error(message);
  }

  // ✅ Fix para evitar doble llamado a .json()
  return res.json() as Promise<T>;
}