import { z } from "zod";

export const planeSegmentSchema = z.object({
  segmentOrder: z.coerce.number().int().min(1, "El orden debe empezar en 1"),

  // 1️⃣ VALIDACIÓN DE CAMPO: Largo 3
  departure: z
    .string()
    .length(3, "El aeropuerto origen debe tener 3 letras (código IATA)")
    .toUpperCase(),

  arrival: z
    .string()
    .length(3, "El aeropuerto destino debe tener 3 letras (código IATA)")
    .toUpperCase(),

  departureDate: z
    .string()
    .refine((v) => !isNaN(Date.parse(v)), {
      message: "La fecha de salida no es válida",
    }),

  arrivalDate: z
    .string()
    .refine((v) => !isNaN(Date.parse(v)), {
      message: "La fecha de llegada no es válida",
    }),

  airline: z.string().max(128).optional().nullable(),

  flightNumber: z.string().max(64).optional().nullable(),
}).refine((data) => data.departure !== data.arrival, {
  // 2️⃣ VALIDACIÓN DE OBJETO: Origen != Destino
  // Solo se ejecuta si el largo de 3 ya pasó
  message: "El origen y el destino no pueden ser iguales",
  path: ["arrival"], 
});

export type PlaneSegmentSchema = z.infer<typeof planeSegmentSchema>;

/**
 * Lista validada + reglas de continuidad
 */
export const planeSegmentListSchema = z
  .array(planeSegmentSchema)
  .min(1, "Debe existir al menos 1 tramo")
  .superRefine((segments, ctx) => {
    // 🛑 GUARDIA: Prioridad a errores de formato básicos
    // Si hay algún código que no sea de 3 letras, abortamos las validaciones de ruta.
    // Esto evita mostrar "Ruta cortada..." cuando el usuario apenas está escribiendo "EZ".
    const hasInvalidCodes = segments.some(
      (s) => s.departure.length !== 3 || s.arrival.length !== 3
    );
    if (hasInvalidCodes) return;

    // 3️⃣ VALIDACIÓN DE ARRAY: Continuidad y Fechas
    // Solo se ejecuta si los tramos individuales tienen códigos válidos
    const sorted = [...segments].sort(
      (a, b) =>
        new Date(a.departureDate).getTime() -
        new Date(b.departureDate).getTime(),
    );

    // Validación A: Llegada antes que salida en el mismo vuelo
    for (const seg of sorted) {
      if (new Date(seg.arrivalDate) < new Date(seg.departureDate)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `El tramo ${seg.departure} → ${seg.arrival} tiene llegada antes de la salida`,
        });
      }
    }

    // Validación B: Continuidad entre tramos
    for (let i = 0; i < sorted.length - 1; i++) {
      const a = sorted[i];
      const b = sorted[i + 1];

      // Solapamiento de fechas
      if (new Date(a.arrivalDate) > new Date(b.departureDate)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Los tramos ${a.departure} → ${a.arrival} y ${b.departure} → ${b.arrival} se superponen`,
        });
      }

      // Continuidad Geográfica (Destino A == Origen B)
      if (a.arrival !== b.departure) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Ruta cortada: El tramo ${a.departure} → ${a.arrival} termina en ${a.arrival} pero el siguiente empieza en ${b.departure}`,
        });
      }
    }
  });