import type { Currency } from "@/lib/interfaces/currency/currency.interface";

export interface Hotel {
  id: string
  reservationId: string
  startDate: string
  endDate: string
  city: string
  hotelName: string
  bookingReference: string
  totalPrice: number
  amountPaid: number
  roomType: string
  provider: string
  currency: Currency
}