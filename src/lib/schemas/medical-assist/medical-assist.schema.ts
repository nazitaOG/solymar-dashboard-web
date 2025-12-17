import { z } from "zod";
import { Currency } from "@/lib/interfaces/currency/currency.interface";

const currencyValues = Object.values(Currency) as [Currency, ...Currency[]];

/**
 * 🩺 Objeto Base: Estructura alineada con Prisma
 */
const medicalAssistBase = z.object({
  // DB: VarChar(255) - OBLIGATORIO según Prisma
  bookingReference: z
    .string()
    .trim()
    .min(1, "La referencia de reserva es obligatoria")
    .max(255, "La referencia no puede superar los 255 caracteres"),

  // DB: String? @db.VarChar(128) - Opcional
  assistType: z
    .string()
    .trim()
    .max(128, "El tipo de asistencia no puede superar los 128 caracteres")
    .optional()
    .or(z.literal("").transform(() => undefined)),

  // DB: VarChar(128)
  provider: z
    .string()
    .min(1, "El proveedor es obligatorio")
    .max(128, "El proveedor no puede superar los 128 caracteres"),

  // Precios
  totalPrice: z.coerce.number().min(0, "El precio no puede ser negativo"),

  amountPaid: z.coerce.number().nonnegative("El monto pagado debe ser positivo"),
});

/**
 * 🟢 CREATE
 */
export const createMedicalAssistSchema = medicalAssistBase.extend({
  currency: z.enum(currencyValues, { message: "Moneda inválida" }).default(Currency.USD),
  reservationId: z.string().uuid("ID de reserva inválido"),
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