// Types based on Prisma schema
export type ReservationState = "PENDING" | "CONFIRMED" | "CANCELLED"
export type Currency = "USD" | "ARS"

export interface CurrencyTotal {
  currency: Currency
  totalPrice: number
  amountPaid: number
}

export interface Pax {
  id: string
  name: string
  birthDate: string
  nationality: string
  passport?: {
    passportNum: string
    expirationDate: string
  }
  dni?: {
    dniNum: string
    expirationDate: string
  }
}

export interface PaxReservation {
  pax: Pax
}

export interface Reservation {
  id: string
  userId: string
  state: ReservationState
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy: string
  currencyTotals: CurrencyTotal[]
  paxReservations: PaxReservation[]
}

export interface ReservationFilters {
  passengerNames?: string[]
  sortBy?: "newest" | "oldest"
  states?: ReservationState[]
  dateFrom?: Date
  dateTo?: Date
  currency?: Currency
}

export interface Hotel {
  id: string
  reservationId: string
  startDate: string
  endDate: string
  city: string
  hotelName: string
  bookingReference: string
  totalPrice: number
  amountPaid: number
  roomType: string
  provider: string
  currency: Currency
}

export interface Plane {
  id: string
  reservationId: string
  departure: string
  arrival: string
  departureDate: string
  arrivalDate: string
  totalPrice: number
  amountPaid: number
  bookingReference: string
  provider: string
  notes?: string
  currency: Currency
}

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

export interface Transfer {
  id: string
  reservationId: string
  origin: string
  destination: string
  departureDate: string
  arrivalDate: string
  bookingReference: string
  provider: string
  transportType: string
  totalPrice: number
  amountPaid: number
  currency: Currency
}

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

export interface ReservationDetail extends Reservation {
  hotels: Hotel[]
  planes: Plane[]
  cruises: Cruise[]
  transfers: Transfer[]
  excursions: Excursion[]
  medicalAssists: MedicalAssist[]
}
