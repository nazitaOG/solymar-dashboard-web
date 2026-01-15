export interface CreatePaxRequest {
  name: string;
  birthDate: string;
  nationality: string;
  passportNum?: string;
  passportExpirationDate?: string;
  dniNum?: string;
  dniExpirationDate?: string;
  email?: string;
  phoneNumber?: string;
}
