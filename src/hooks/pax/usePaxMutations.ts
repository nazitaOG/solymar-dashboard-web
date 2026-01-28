import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/api/fetchApi";
import type { Pax } from "@/lib/interfaces/pax/pax.interface";
import type { CreatePaxRequest } from "@/lib/interfaces/pax/pax-request.interface";

export const useCreatePax = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePaxRequest) =>
      fetchAPI<Pax>("/pax", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      // Invalidamos para que CUALQUIER lista de pasajeros en la app se actualice
      queryClient.invalidateQueries({ queryKey: ["pax"] });
    },
  });
};

export const useUpdatePax = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreatePaxRequest }) =>
      fetchAPI<Pax>(`/pax/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pax"] });
    },
  });
};