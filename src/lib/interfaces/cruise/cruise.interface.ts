import { Currency } from "../currency/currency.interface"

export interface Cruise {
  id: string;
  startDate: string;
  endDate: string | null;
  bookingReference: string | null;
  provider: string;
  embarkationPort: string;
  arrivalPort: string | null;
  totalPrice: number;
  amountPaid: number;
  reservationId: string;
  currency: Currency;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}
