// 📁 src/lib/utils/reservation/normalize_reservation.utils.ts
import type {
  ReservationDetail,
  ReservationState,
  ReservationCurrencyTotal,
} from "@/lib/interfaces/reservation/reservation.interface";
import type { PaxReservation as PaxReservationInterface } from "@/lib/interfaces/pax/pax.interface";
import type { Hotel } from "@/lib/interfaces/hotel/hotel.interface";
import type { Plane } from "@/lib/interfaces/plane/plane.interface";
import type { Cruise } from "@/lib/interfaces/cruise/cruise.interface";
import type { Transfer } from "@/lib/interfaces/transfer/transfer.interface";
import type { Excursion } from "@/lib/interfaces/excursion/excursion.interface";
import type { MedicalAssist } from "@/lib/interfaces/medical_assist/medical_assist.interface";

/**
 * 🧩 normalizeReservation
 * Mantiene arrays y datos válidos, evitando reemplazos destructivos.
 * Solo completa valores realmente nulos o indefinidos.
 */
export function normalizeReservation(
  partial: Partial<ReservationDetail> | null | undefined
): ReservationDetail {
  const keepArray = <T,>(arr: T[] | null | undefined): T[] =>
    Array.isArray(arr) && arr.length >= 0 ? arr : [];

  const safeDate = (date: string | undefined): string =>
    date ?? new Date().toISOString();

  return {
    id: partial?.id ?? "",
    userId: partial?.userId ?? "",
    state: (partial?.state as ReservationState) ?? "PENDING",
    createdAt: safeDate(partial?.createdAt),
    updatedAt: safeDate(partial?.updatedAt),
    createdBy: partial?.createdBy ?? "",
    updatedBy: partial?.updatedBy ?? "",

    paxReservations: keepArray(partial?.paxReservations as PaxReservationInterface[]),
    currencyTotals: keepArray(partial?.currencyTotals as ReservationCurrencyTotal[]),
    hotels: keepArray(partial?.hotels as Hotel[]),
    planes: keepArray(partial?.planes as Plane[]),
    cruises: keepArray(partial?.cruises as Cruise[]),
    transfers: keepArray(partial?.transfers as Transfer[]),
    excursions: keepArray(partial?.excursions as Excursion[]),
    medicalAssists: keepArray(partial?.medicalAssists as MedicalAssist[]),
  };
}
