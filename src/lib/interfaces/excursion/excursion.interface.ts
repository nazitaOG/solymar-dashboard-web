import { Currency } from "../currency/currency.interface"

export interface Excursion {
  id: string
  reservationId: string
  excursionName: string
  origin: string
  provider: string
  excursionDate: string
  bookingReference: string
  totalPrice: number
  amountPaid: number
  currency: Currency
}