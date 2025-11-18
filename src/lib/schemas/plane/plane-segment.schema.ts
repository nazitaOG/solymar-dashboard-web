// src/lib/schemas/plane/plane-segment.schema.ts

import { z } from "zod";

export const planeSegmentSchema = z.object({
  segmentOrder: z.coerce.number().int().min(1, "El orden debe empezar en 1"),

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
});

export type PlaneSegmentSchema = z.infer<typeof planeSegmentSchema>;

/**
 * Lista validada + reglas de continuidad
 */
export const planeSegmentListSchema = z
  .array(planeSegmentSchema)
  .min(1, "Debe existir al menos 1 tramo")
  .superRefine((segments, ctx) => {
    const sorted = [...segments].sort(
      (a, b) =>
        new Date(a.departureDate).getTime() -
        new Date(b.departureDate).getTime(),
    );

    for (const seg of sorted) {
      if (new Date(seg.arrivalDate) < new Date(seg.departureDate)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `El tramo ${seg.departure} → ${seg.arrival} tiene llegada antes de la salida`,
        });
      }
    }

    for (let i = 0; i < sorted.length - 1; i++) {
      const a = sorted[i];
      const b = sorted[i + 1];

      if (new Date(a.arrivalDate) > new Date(b.departureDate)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Los tramos ${a.departure} → ${a.arrival} y ${b.departure} → ${b.arrival} se superponen`,
        });
      }

      if (a.arrival !== b.departure) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `El tramo ${a.departure} → ${a.arrival} termina en ${a.arrival} pero el siguiente empieza en ${b.departure}`,
        });
      }
    }
  });
