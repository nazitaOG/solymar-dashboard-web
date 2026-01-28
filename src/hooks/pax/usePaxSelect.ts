import { useQuery } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/api/fetchApi";
import type { Pax } from "@/lib/interfaces/pax/pax.interface";

export const usePaxSelect = () => {
  return useQuery({
    // 🔑 CAMBIAMOS LA KEY: Le agregamos 'with-docs' para que React Query
    // sepa que esta es una lista diferente (más completa) y no use la caché vieja vacía.
    queryKey: ["pax", "select", "with-docs"],

    queryFn: async () => {
      // 👇 AQUÍ ESTÁ LA MAGIA: Agregamos &include=dni,passport
      const response = await fetchAPI<Pax[] | { data: Pax[] }>(
        "/pax?limit=1000&include=dni,passport"
      );

      // Normalizamos por si tu API devuelve paginado { data: [...] } o array [...]
      if ("data" in response && Array.isArray(response.data)) {
        return response.data;
      }
      return response as Pax[];
    },

    // 🛑 CONFIGURACIÓN "MODO STORE"
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};