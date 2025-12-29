// 📁 src/lib/utils/reservation/normalize_reservation.utils.ts
import type {
  ReservationDetail,
} from "@/lib/interfaces/reservation/reservation.interface";
import { ReservationState } from "@/lib/interfaces/reservation/reservation.interface";

/**
 * 🧩 normalizeReservation
 * Mantiene arrays y datos válidos, evitando reemplazos destructivos.
 * Solo completa valores realmente nulos o indefinidos.
 */
export function normalizeReservation(
  partial: Partial<ReservationDetail> | null | undefined
): ReservationDetail {
  const keepArray = <T,>(arr: T[] | null | undefined): T[] =>
    Array.isArray(arr) ? arr : [];

  const safeDate = (date: string | undefined): string =>
    date ?? new Date().toISOString();

  return {
    id: partial?.id ?? "",
    code: partial?.code ?? 0,
    name: partial?.name ?? "",
    userId: partial?.userId ?? "",
    state: partial?.state ?? ReservationState.PENDING,
    createdAt: safeDate(partial?.createdAt),
    updatedAt: safeDate(partial?.updatedAt),
    createdBy: partial?.createdBy ?? "",
    updatedBy: partial?.updatedBy ?? "",
    notes: partial?.notes ?? "",
    paxReservations: keepArray(partial?.paxReservations),
    currencyTotals: keepArray(partial?.currencyTotals),
    hotels: keepArray(partial?.hotels),
    planes: keepArray(partial?.planes),
    cruises: keepArray(partial?.cruises),
    transfers: keepArray(partial?.transfers),
    excursions: keepArray(partial?.excursions),
    medicalAssists: keepArray(partial?.medicalAssists),
    carRentals: keepArray(partial?.carRentals),
  };
}
