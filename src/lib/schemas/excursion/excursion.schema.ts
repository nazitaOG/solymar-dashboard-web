import { z } from "zod";
import { Currency } from "@/lib/interfaces/currency/currency.interface";

const currencyValues = Object.values(Currency) as [Currency, ...Currency[]];

/**
 * 🏔️ Objeto Base (Solo estructura, sin refinamientos)
 */
const excursionBase = z.object({
  excursionName: z.string().min(1, "El nombre de la excursión es obligatorio"),
  origin: z.string().min(1, "El origen es obligatorio"),
  provider: z.string().min(1, "El proveedor es obligatorio"),

  excursionDate: z
    .string()
    .min(1, "La fecha de la excursión es obligatoria")
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "La fecha de la excursión no es válida",
    }),

  bookingReference: z
    .string()
    .min(1, "La referencia de reserva es obligatoria")
    .optional()
    .or(z.literal("").transform(() => undefined)),

  // Ajustado a min(0) para permitir precio 0 si fuese necesario (bonificación, etc)
  totalPrice: z.coerce.number().min(0, "El precio no puede ser negativo"),

  amountPaid: z.coerce.number().nonnegative("El monto pagado debe ser positivo"),
});

/**
 * 🟢 CREATE
 */
export const createExcursionSchema = excursionBase.extend({
  currency: z.enum(currencyValues, { message: "Moneda inválida" }).default(Currency.USD),
  reservationId: z.string().uuid("reservationId inválido"),
});
// Nota: Eliminamos el refine de precios aquí para delegarlo al Frontend (React)
// o a una validación posterior, manteniendo consistencia con los otros schemas.

/**
 * ✏️ UPDATE
 */
export const updateExcursionSchema = excursionBase
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message: "Debes modificar al menos un campo",
    }
  );

// 🧩 Derivaciones tipadas
export type ExcursionCreateSchema = z.infer<typeof createExcursionSchema>;
export type ExcursionUpdateSchema = z.infer<typeof updateExcursionSchema>;