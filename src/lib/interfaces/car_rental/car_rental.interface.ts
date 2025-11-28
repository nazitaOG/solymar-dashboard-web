import { Currency } from "@/lib/interfaces/currency/currency.interface";

export interface CarRental {
  id: string;
  reservationId: string;
  provider: string;
  bookingReference?: string;
  
  pickupDate: string;
  dropoffDate: string;
  pickupLocation: string;
  dropoffLocation: string;
  
  carCategory: string;
  carModel?: string;
  
  totalPrice: number;
  amountPaid: number;
  currency: Currency;
  
  createdAt?: string;
  updatedAt?: string;
}