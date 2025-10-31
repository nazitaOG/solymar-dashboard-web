import type { Currency } from "../currency/currency.interface";

export interface Hotel {
  id: string;
  startDate: string;
  endDate: string;
  city: string;
  hotelName: string;
  bookingReference: string;
  totalPrice: number;
  amountPaid: number;
  roomType: string;
  provider: string;
  currency: Currency;
  reservationId: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}
