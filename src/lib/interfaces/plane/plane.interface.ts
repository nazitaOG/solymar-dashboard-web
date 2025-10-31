import type { Currency } from "@/lib/interfaces/currency/currency.interface";

export interface Plane {
  id: string;
  departure: string;
  arrival: string | null;
  departureDate: string;
  arrivalDate: string | null;
  bookingReference: string;
  provider: string | null;
  totalPrice: number;
  amountPaid: number;
  notes: string | null;
  currency: Currency;
  reservationId: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}
