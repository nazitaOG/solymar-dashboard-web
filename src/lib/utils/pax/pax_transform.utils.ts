import type { Pax } from "@/lib/interfaces/pax/pax.interface";
import type { CreatePaxRequest } from "@/lib/interfaces/pax/pax-request.interface";

export function paxToRequest(pax: Partial<Pax>): CreatePaxRequest {
  return {
    name: pax.name ?? "",
    birthDate: pax.birthDate ?? "",
    nationality: pax.nationality ?? "",
    passportNum: pax.passport?.passportNum,
    passportExpirationDate: pax.passport?.expirationDate,
    dniNum: pax.dni?.dniNum,
    dniExpirationDate: pax.dni?.expirationDate,
    email: pax.email ?? "",
    phoneNumber: pax.phoneNumber ?? "",
  };
}
