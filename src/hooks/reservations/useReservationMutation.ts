import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/api/fetchApi"; // 👈 Usamos tu fetch universal
import type { Reservation, ReservationState } from "@/lib/interfaces/reservation/reservation.interface";

export const useReservationMutations = () => {
  const queryClient = useQueryClient();

  // 1. Mutación para BORRAR
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetchAPI(`/reservations/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      // Al borrar, avisamos que la lista de reservas ya no es válida
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
    },
  });

  // 2. Mutación para CREAR
  const createMutation = useMutation({
    mutationFn: (payload: { state: ReservationState; paxIds: string[] }) =>
      fetchAPI<Reservation>("/reservations", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
    },
  });

  // 3. Mutación para EDITAR
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { state: ReservationState; paxIds: string[] } }) =>
      fetchAPI<Reservation>(`/reservations/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: (updatedRes) => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      // También invalidamos el detalle específico si alguien lo está viendo
      queryClient.invalidateQueries({ queryKey: ["reservation", updatedRes.id] });
    },
  });

  return {
    deleteReservation: deleteMutation,
    createReservation: createMutation,
    updateReservation: updateMutation,
  };
};