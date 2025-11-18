import type { Currency } from "@/lib/interfaces/currency/currency.interface";
import type { PlaneSegment } from "./plane-segment.interface";

export interface Plane {
  id: string;
  bookingReference: string;
  provider: string | null;
  totalPrice: number;
  amountPaid: number;
  currency: Currency;
  notes: string | null;
  reservationId: string;

  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;

  segments: PlaneSegment[];
}
