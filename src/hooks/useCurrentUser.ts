// src/hooks/useCurrentUser.ts
import { useAuthStore } from "@/stores/useAuthStore"
import { useQuery } from "@tanstack/react-query"
import { fetchAPI } from "@/lib/api/fetchApi"

// Definí el tipo de usuario que te devuelve el endpoint /auth/profile
interface User {
  id: string
  email: string
  username: string
  roles: string[]
}

export function useCurrentUser() {
  const { token, logout } = useAuthStore()

  return useQuery({
    queryKey: ["currentUser"],

    // 👇 queryFn usa directamente fetchAPI, que ya maneja el token y los errores
    queryFn: async (): Promise<User> => {
      try {
        return await fetchAPI<User>("/auth/profile")
      } catch (err) {
        console.error("Error en useCurrentUser:", err)
        logout()
        throw err
      }
    },

    enabled: !!token, // solo corre si hay token
    staleTime: 1000 * 60 * 5, // opcional: cachea 5 minutos
  })
}
