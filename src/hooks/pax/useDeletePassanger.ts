// src/lib/hooks/pax/useDeletePassanger.ts
import { useTransition, useState } from "react";
import { fetchAPI } from "@/lib/api/fetchApi";

interface UseDeletePassengerOptions {
  onDeleteSuccess?: (id: string) => void;
}

export function useDeletePassenger({ onDeleteSuccess }: UseDeletePassengerOptions = {}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function deletePassenger(id: string) {
    // Limpiamos errores previos antes de cada intento
    setError(null);

    startTransition(async () => {
      try {
        await fetchAPI<void>(`/pax/${id}`, { method: "DELETE" });
        onDeleteSuccess?.(id);
      } catch (err: unknown) {
        let msg = "Error inesperado en el servidor.";
        
        if (err instanceof Error) {
          const raw = err.message;
          
          // 🎯 Mensaje personalizado solicitado:
          // Buscamos "quedaría sin documentos" o "reserva" para identificar el trigger de Postgres
          if (raw.includes("quedaría sin documentos") || raw.includes("reserva")) {
            msg = "No se puede eliminar: el pasajero es el único en una reserva activa. Por favor, elimine primero la reserva.";
          } 
          // Manejo de restricciones de integridad (ej: tiene facturas o historial)
          else if (raw.includes("Foreign key constraint") || raw.includes("P2003")) {
            msg = "No se puede eliminar: el pasajero tiene servicios o registros asociados.";
          } 
          // Si el servidor mandó un error descriptivo distinto, lo respetamos
          else if (raw !== "Internal Server Error") {
            msg = raw;
          }
        }
        
        setError(msg);
      }
    });
  }

  return { deletePassenger, isPending, error };
}