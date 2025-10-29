import { Currency } from "../currency/currency.interface"

export interface Transfer {
  id: string
  reservationId: string
  origin: string
  destination: string
  departureDate: string
  arrivalDate: string
  bookingReference: string
  provider: string
  transportType: string
  totalPrice: number
  amountPaid: number
  currency: Currency
}