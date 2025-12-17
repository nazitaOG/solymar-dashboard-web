import { z } from "zod";
import { 
  validateEndAfterStart, 
  validateMinOneHourGap, 
  arrivalDateErrorConfig,
  arrivalDateMinDurationErrorConfig 
} from "@/lib/schemas/utils/date-validations";

// ----------------------------------------------------------------------
// 1. Schema de un solo segmento (Tramo)
// ----------------------------------------------------------------------
export const planeSegmentSchema = z.object({
  segmentOrder: z.coerce.number().int().min(1, "El orden debe empezar en 1"),

  // DB: VarChar(3)
  departure: z
    .string()
    .length(3, "El código debe tener 3 letras")
    .toUpperCase(),

  // DB: VarChar(3)
  arrival: z
    .string()
    .length(3, "El código debe tener 3 letras")
    .toUpperCase(),

  departureDate: z
    .string()
    .refine((v) => !isNaN(Date.parse(v)), { message: "Fecha inválida" }),

  arrivalDate: z
    .string()
    .refine((v) => !isNaN(Date.parse(v)), { message: "Fecha inválida" }),

  // DB: VarChar(128)
  airline: z
    .string()
    .max(128, "La aerolínea no puede superar 128 caracteres")
    .optional()
    .nullable(),

  // DB: VarChar(64)
  flightNumber: z
    .string()
    .max(64, "El número de vuelo no puede superar 64 caracteres")
    .optional()
    .nullable(),
})
// 1️⃣ Regla de Negocio: Origen != Destino
.refine((data) => data.departure !== data.arrival, {
  message: "El origen y el destino no pueden ser iguales",
  path: ["arrival"],
})
// 2️⃣ Regla de Fechas: Llegada >= Salida
.refine(validateEndAfterStart, arrivalDateErrorConfig)
// 3️⃣ Regla de Duración: Vuelo mínimo de 1 hora
.refine(validateMinOneHourGap, arrivalDateMinDurationErrorConfig);

export type PlaneSegmentSchema = z.infer<typeof planeSegmentSchema>;

// ----------------------------------------------------------------------
// 2. Schema de la Lista de Segmentos (Validaciones cruzadas)
// ----------------------------------------------------------------------
export const planeSegmentListSchema = z
  .array(planeSegmentSchema)
  .min(1, "Debe existir al menos 1 tramo")
  .superRefine((segments, ctx) => {
    // 🛑 GUARDIA: Si hay códigos IATA inválidos, no validamos rutas aún
    const hasInvalidCodes = segments.some(
      (s) => s.departure.length !== 3 || s.arrival.length !== 3
    );
    if (hasInvalidCodes) return;

    // Ordenamos por fecha para verificar continuidad cronológica
    const sorted = [...segments].sort(
      (a, b) =>
        new Date(a.departureDate).getTime() -
        new Date(b.departureDate).getTime(),
    );

    // 🔄 VALIDACIÓN DE CONTINUIDAD ENTRE TRAMOS
    // Comparamos el tramo actual (i) con el siguiente (i+1)
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];

      // A) Solapamiento: El siguiente sale antes de que el actual llegue
      if (new Date(current.arrivalDate) > new Date(next.departureDate)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Conflicto de horarios: El tramo ${current.departure}→${current.arrival} llega después de que salga el siguiente`,
          path: [i, "arrivalDate"], // Marcamos el error en el tramo conflictivo
        });
      }

      // B) Continuidad Geográfica: Destino A debe ser Origen B
      // (Opcional: A veces hay "open jaw" o cambio de aeropuerto en la misma ciudad, 
      // pero si tu regla es estricta, déjalo así)
      if (current.arrival !== next.departure) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Ruta cortada: El tramo termina en ${current.arrival} pero el siguiente empieza en ${next.departure}`,
          path: [i + 1, "departure"], // Marcamos el error en el siguiente tramo
        });
      }
    }
  });