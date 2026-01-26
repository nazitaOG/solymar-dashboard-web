import { useMutation } from "@tanstack/react-query"
import { fetchAPI } from "@/lib/api/fetchApi"
import { useAuthStore } from "@/stores/useAuthStore"
import { useNavigate } from "react-router"

interface LoginResponse {
  username: string
  email: string
  token: string
  isActive: boolean
}

interface LoginPayload {
  email: string;
  password?: string;
}

export const useLoginMutation = () => {
  const { setToken } = useAuthStore()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async ({ email, password }: LoginPayload) => {
      return await fetchAPI<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      })
    },
    onSuccess: (data, variables) => {
      setToken(data.token)
      const shouldRemember = localStorage.getItem("tempRequestRemember") === "true"
      if (shouldRemember) localStorage.setItem("rememberEmail", variables.email)
      else localStorage.removeItem("rememberEmail")
      
      localStorage.removeItem("tempRequestRemember")
      navigate("/reservas", { replace: true })
    },
  })
}

export const useForgotPasswordMutation = () => {
  return useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      return await fetchAPI("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      })
    },
  })
}