import { Currency } from "../currency/currency.interface"

export enum TransportType {
  PICKUP = "PICKUP",
  BUS = "BUS",
  TRAIN = "TRAIN",
  FERRY = "FERRY",
  OTHER = "OTHER",
}

export interface Transfer {
  id: string;
  origin: string;
  destination: string | null;
  departureDate: string;
  arrivalDate: string;
  bookingReference: string | null;
  provider: string;
  reservationId: string;
  totalPrice: number;
  amountPaid: number;
  transportType: TransportType;
  currency: Currency;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}