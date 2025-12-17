import { z } from "zod";
import { Currency } from "@/lib/interfaces/currency/currency.interface";

const currencyValues = Object.values(Currency) as [Currency, ...Currency[]];

/**
 * 🩺 Objeto Base (Solo estructura, sin refinamientos complejos)
 */
const medicalAssistBase = z.object({
  bookingReference: z
    .string()
    .trim()
    .min(1, "La referencia de reserva es obligatoria")
    .optional()
    .or(z.literal("").transform(() => undefined)),

  assistType: z
    .string()
    .trim()
    .min(1, "El tipo de asistencia es obligatorio")
    .optional()
    .or(z.literal("").transform(() => undefined)),

  provider: z.string().min(1, "El proveedor es obligatorio"),

  // Ajustado a min(0) para consistencia (permite 0, no negativos)
  totalPrice: z.coerce.number().min(0, "El precio no puede ser negativo"),

  amountPaid: z.coerce
    .number()
    .nonnegative("El monto pagado debe ser positivo o cero"),
});

/**
 * 🟢 CREATE
 */
export const createMedicalAssistSchema = medicalAssistBase.extend({
  currency: z.enum(currencyValues, { message: "Moneda inválida" }).default(Currency.USD),
  reservationId: z.string().uuid("reservationId inválido"),
});

/**
 * ✏️ UPDATE
 */
export const updateMedicalAssistSchema = medicalAssistBase
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0, 
    {
      message: "Debes modificar al menos un campo",
    }
  );

// Derivaciones tipadas
export type MedicalAssistCreateSchema = z.infer<typeof createMedicalAssistSchema>;
export type MedicalAssistUpdateSchema = z.infer<typeof updateMedicalAssistSchema>;