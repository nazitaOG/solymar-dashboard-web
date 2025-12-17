import { z } from "zod";

export const planeBaseSchema = z.object({
  // DB: VarChar(255)
  bookingReference: z
    .string()
    .min(1, "La referencia de reserva es obligatoria")
    .max(255, "La referencia no puede superar los 255 caracteres"),

  // DB: VarChar(128)
  provider: z
    .string()
    .max(128, "El proveedor no puede superar los 128 caracteres")
    .optional()
    .or(z.literal("").transform(() => undefined)),

  totalPrice: z
    .coerce.number()
    .min(0, "El precio total no puede ser negativo"),

  amountPaid: z
    .coerce.number()
    .min(0, "El monto pagado no puede ser negativo"),

  notes: z
    .string()
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type PlaneBaseSchema = z.infer<typeof planeBaseSchema>;