import { Currency } from "../currency/currency.interface"

export interface MedicalAssist {
  id: string;
  totalPrice: number;
  amountPaid: number;
  bookingReference: string;
  assistType: string | null;
  provider: string;
  reservationId: string;
  currency: Currency;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}
