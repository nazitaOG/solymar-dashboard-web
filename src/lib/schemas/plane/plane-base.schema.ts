// src/lib/schemas/plane/plane-base.schema.ts

import { z } from "zod";

export const planeBaseSchema = z.object({
  bookingReference: z.string().min(1, "La referencia de reserva es obligatoria"),

  provider: z.string().min(1, "El proveedor es obligatorio"),

  totalPrice: z
    .coerce.number()
    .min(0.01, "El precio total debe ser mayor que 0"),

  amountPaid: z
    .coerce.number()
    .min(0, "El monto pagado no puede ser negativo"),

  notes: z
    .string()
    .max(1024, "Las notas no deben superar los 1024 caracteres")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type PlaneBaseSchema = z.infer<typeof planeBaseSchema>;
