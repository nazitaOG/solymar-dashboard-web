export interface PlaneSegment {
  id: string;
  segmentOrder: number;
  departure: string;
  arrival: string;
  departureDate: string; // ISO
  arrivalDate: string; // ISO
  airline: string | null;
  flightNumber: string | null;
}
