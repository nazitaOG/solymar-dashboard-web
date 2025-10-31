import { Currency } from "../currency/currency.interface"

export interface Excursion {
  id: string;
  totalPrice: number;
  amountPaid: number;
  origin: string;
  provider: string;
  bookingReference: string | null;
  excursionDate: string;
  excursionName: string;
  reservationId: string;
  currency: Currency;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}
