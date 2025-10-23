import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/useAuthStore";

interface LoginDto {
  email: string;
  password: string;
}

export function useLogin() {
  const setToken = useAuthStore((s) => s.setToken);

  return useMutation({
    mutationFn: async (credentials: LoginDto) => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      if (!res.ok) throw new Error("Credenciales inválidas");
      const data = await res.json();

      if (!data.access_token) throw new Error("Token no recibido");

      setToken(data.access_token);
      return data;
    },
  });
}
