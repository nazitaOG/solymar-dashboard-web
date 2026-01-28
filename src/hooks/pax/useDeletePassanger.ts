import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/api/fetchApi";

export function useDeletePassenger() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        await fetchAPI<void>(`/pax/${id}`, { method: "DELETE" });
      } catch (err: unknown) {
        // 👇 TU LÓGICA DE LIMPIEZA DE ERRORES
        let msg = "Error inesperado en el servidor.";

        if (err instanceof Error) {
          const raw = err.message || "";

          if (raw.includes("quedaría sin documentos") || raw.includes("reserva")) {
            msg = "No se puede eliminar: es el único pasajero de una reserva activa.";
          } 
          else if (raw.includes("Foreign key constraint") || raw.includes("P2003")) {
            msg = "No se puede eliminar: tiene registros asociados.";
          } 
          else if (raw !== "Internal Server Error") {
            msg = raw;
          }
        }

        // 🚨 IMPORTANTE: Lanzamos el error limpio.
        // Esto hará que 'isError' sea true y 'error.message' tenga este texto.
        throw new Error(msg);
      }
    },
    
    // Si sale bien, recargamos la tabla silenciosamente
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pax"] });
    },
  });
}