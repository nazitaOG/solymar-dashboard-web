// ✅ Store global de autenticación con Zustand + persist + jwtDecode
// - Guarda el token JWT y su expiración decodificada
// - Permite validar y refrescar el token automáticamente
// - Persiste en localStorage o sessionStorage según el caso

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { jwtDecode } from "jwt-decode"

// Estructura mínima del JWT decodificado (claim estándar)
interface DecodedToken {
  exp: number
}

// Estado y acciones del store
interface AuthState {
  token: string | null
  expiresAt: number | null
  setToken: (token: string) => void
  logout: () => void
  isTokenValid: () => boolean
  tryRefreshToken: () => Promise<string | null>
  getValidToken: () => Promise<string | null>
}

// ⚙️ Store principal
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      expiresAt: null,

      // 👉 Guarda token y calcula fecha de expiración localmente
      setToken: (token) => {
        const decoded = jwtDecode<DecodedToken>(token)
        set({
          token,
          expiresAt: decoded.exp ? decoded.exp * 1000 : null,
        })
      },

      // 👉 Limpia toda la sesión
      logout: () => {
        set({ token: null, expiresAt: null })
      },

      // 👉 Verifica si el token es válido (expiración local + margen de 5 min)
      isTokenValid: () => {
        const { token, expiresAt } = get()
        if (!token || !expiresAt) return false
        const now = Date.now()
        const fiveMin = 5 * 60 * 1000
        return now < expiresAt - fiveMin
      },

      // 👉 Si el token vence, intenta refrescarlo usando el endpoint /auth/refresh
      tryRefreshToken: async () => {
        const { token, setToken, logout } = get()
        if (!token) return null

        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/refresh`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          })

          if (!res.ok) {
            logout()
            return null
          }

          const data = await res.json()
          // ⚠️ Ajuste al backend actual (tu servicio devuelve "token")
          if (data.token) {
            setToken(data.token)
            return data.token
          }

          logout()
          return null
        } catch (err) {
          console.error("Error al refrescar el token:", err)
          logout()
          return null
        }
      },

      // 👉 Devuelve token válido (refresca si es necesario)
      getValidToken: async () => {
        const { isTokenValid, tryRefreshToken, token } = get()
        if (isTokenValid()) return token
        return await tryRefreshToken()
      },
    }),
    {
      name: "auth-storage", // persistencia automática (localStorage)
    }
  )
)
