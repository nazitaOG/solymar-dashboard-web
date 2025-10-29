import { Currency } from "../currency/currency.interface"

export interface Cruise {
  id: string
  reservationId: string
  startDate: string
  endDate: string
  bookingReference: string
  provider: string
  embarkationPort: string
  arrivalPort: string
  totalPrice: number
  amountPaid: number
  currency: Currency
}
