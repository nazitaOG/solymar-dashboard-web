import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/api/fetchApi";
import type { Reservation } from "@/lib/interfaces/reservation/reservation.interface";
import type { PaginatedResponse } from "@/lib/interfaces/api.interface";

interface FetchParams {
  page: number;
  name?: string;
  state?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const useReservations = (params: FetchParams) => {
  return useQuery({
    // La llave de cache incluye los params. Si cambia la página, es otra entrada de cache.
    queryKey: ["reservations", params],
    queryFn: async () => {
      const query = new URLSearchParams();
      const limit = 20;
      const offset = (params.page - 1) * limit;

      query.append("include", "paxReservations,currencyTotals,hotels,planes,cruises,transfers,excursions,medicalAssists");
      query.append("limit", limit.toString());
      query.append("offset", offset.toString());

      if (params.name) query.append("passengerName", params.name);
      if (params.state) query.append("state", params.state);
      if (params.dateFrom) query.append("dateFrom", params.dateFrom);
      if (params.dateTo) query.append("dateTo", params.dateTo);

      return fetchAPI<PaginatedResponse<Reservation>>(`/reservations?${query.toString()}`);
    },
    // 🔥 Esto hace que cuando cambies de página, se mantenga la data vieja en pantalla
    // hasta que la nueva termine de cargar. Evita el "salto" de layout.
    placeholderData: keepPreviousData,
  });
};