import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreatePaxRequest } from "@/lib/types/pax/pax-request";

export function useCreatePax() {
  const queryClient = useQueryClient();
  return useMutation({
    // Función que ejecuta el POST al backend NestJS
    mutationFn: async (data: CreatePaxRequest) => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/pax`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        throw new Error('Failed to create pax');
      }
      return res.json(); // TanStack guarda esto en mutation.data
    },
    // Se ejecuta automáticamente cuando el POST tiene éxito
    onSuccess: () => {
      // invalidateQueries() no borra el caché: marca la query ["pax"] como "stale" (obsoleta)
      // Esto le indica a TanStack Query que los datos locales ya no son confiables,
      // y que debe hacer automáticamente un refetch de la lista de pasajeros
      // para mantener la UI sincronizada con el backend después de crear/editar/eliminar.
      queryClient.invalidateQueries({ queryKey: ['pax'] });
    },
  });
}