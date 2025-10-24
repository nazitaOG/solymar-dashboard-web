// src/lib/hooks/useDeletePassenger.ts
import { useTransition, useState } from "react";
import { fetchAPI } from "@/lib/api/fetchApi";

interface UseDeletePassengerOptions {
  onDeleteSuccess?: (id: string) => void;
}

export function useDeletePassenger({ onDeleteSuccess }: UseDeletePassengerOptions = {}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function deletePassenger(id: string, name?: string) {
    const confirmed = window.confirm(
      name
        ? `¿Seguro que querés eliminar a ${name}?`
        : "¿Seguro que querés eliminar este pasajero?"
    );
    if (!confirmed) return;

    startTransition(async () => {
      try {
        await fetchAPI<void>(`/pax/${id}`, { method: "DELETE" });
        onDeleteSuccess?.(id);
        setError(null);
      } catch (err) {
        console.error("Error eliminando pasajero:", err);
        const msg =
          err instanceof Error && err.message
            ? err.message
            : "Error al eliminar el pasajero. Intenta más tarde.";
        setError(msg);
      }
    });
  }

  return { deletePassenger, isPending, error };
}
