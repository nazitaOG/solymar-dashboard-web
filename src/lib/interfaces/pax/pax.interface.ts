export interface Pax {
  id: string
  name: string
  birthDate: string
  nationality: string
  passport?: {
    passportNum: string
    expirationDate?: string
  }
  dni?: {
    dniNum: string
    expirationDate?: string
  }
}

export interface PaxReservation {
  pax: Pax
}