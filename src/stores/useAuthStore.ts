import { create } from "zustand";
import { persist } from "zustand/middleware";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  sub: string; // UUID del usuario
  email?: string;
  name?: string;
  exp: number;
}

interface AuthState {
  token: string | null;
  expiresAt: number | null;
  user: { id: string; email?: string; name?: string } | null;
  setToken: (token: string) => void;
  logout: () => void;
  isTokenValid: () => boolean;
  tryRefreshToken: () => Promise<string | null>;
  getValidToken: () => Promise<string | null>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      expiresAt: null,
      user: null,

      setToken: (token) => {
        const decoded = jwtDecode<DecodedToken>(token);
        set({
          token,
          expiresAt: decoded.exp ? decoded.exp * 1000 : null,
          user: decoded.sub
            ? { id: decoded.sub, email: decoded.email, name: decoded.name }
            : null,
        });
      },

      logout: () => set({ token: null, expiresAt: null, user: null }),

      isTokenValid: () => {
        const { token, expiresAt } = get();
        if (!token || !expiresAt) return false;
        const now = Date.now();
        const fiveMin = 5 * 60 * 1000;
        return now < expiresAt - fiveMin;
      },

      tryRefreshToken: async () => {
        const { token, setToken, logout } = get();
        if (!token) return null;

        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/refresh`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!res.ok) {
            logout();
            return null;
          }

          const data = await res.json();
          if (data.token) {
            setToken(data.token);
            return data.token;
          }

          logout();
          return null;
        } catch (err) {
          console.error("Error al refrescar el token:", err);
          logout();
          return null;
        }
      },

      getValidToken: async () => {
        const { isTokenValid, tryRefreshToken, token } = get();
        if (isTokenValid()) return token;
        return await tryRefreshToken();
      },
    }),
    { name: "auth-storage" }
  )
);
