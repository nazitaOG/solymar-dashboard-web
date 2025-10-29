// ✅ Reserva
import type { Currency, CurrencyTotal } from "@/lib/interfaces/currency/currency.interface";
import type { Hotel } from "@/lib/interfaces/hotel/hotel.interface";
import type { Plane } from "@/lib/interfaces/plane/plane.interface";
import type { Cruise } from "@/lib/interfaces/cruise/cruise.interface";
import type { Transfer } from "@/lib/interfaces/transfer/transfer.interface";
import type { Excursion } from "@/lib/interfaces/excursion/excursion.interface";
import type { MedicalAssist } from "@/lib/interfaces/medical_assist/medical_assist.interface";

export type ReservationState = "PENDING" | "CONFIRMED" | "CANCELLED";

export interface PaxSummary {
  id: string;
  name: string;
  birthDate?: string;
  nationality?: string;
}

export interface ReservationPaxRelation {
  pax: PaxSummary;
}

export interface Reservation {
  id: string;
  userId: string;
  state: ReservationState;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  paxReservations: ReservationPaxRelation[];
  currencyTotals: CurrencyTotal[];
}

export interface ReservationFilters {
  passengerNames?: string[];
  sortBy?: "newest" | "oldest";
  states?: ReservationState[];
  dateFrom?: Date;
  dateTo?: Date;
  currency?: Currency;
}

export interface ReservationDetail extends Reservation {
  hotels: Hotel[]
  planes: Plane[]
  cruises: Cruise[]
  transfers: Transfer[]
  excursions: Excursion[]
  medicalAssists: MedicalAssist[]
}

