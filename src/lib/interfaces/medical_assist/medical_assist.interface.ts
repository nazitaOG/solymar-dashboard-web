import { Currency } from "../currency/currency.interface"

export interface MedicalAssist {
  id: string
  reservationId: string
  assistType: string
  provider: string
  bookingReference: string
  totalPrice: number
  amountPaid: number
  currency: Currency
}

