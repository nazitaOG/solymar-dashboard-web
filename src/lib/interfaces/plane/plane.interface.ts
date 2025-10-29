import type { Currency } from "@/lib/interfaces/currency/currency.interface";

export interface Plane {
  id: string
  reservationId: string
  departure: string
  arrival: string
  departureDate: string
  arrivalDate: string
  totalPrice: number
  amountPaid: number
  bookingReference: string
  provider: string
  notes?: string
  currency: Currency
}
