import { z } from "zod";
import { Currency } from "@/lib/interfaces/currency/currency.interface";

const currencyValues = Object.values(Currency) as [Currency, ...Currency[]];

/**
 * 🏔️ Objeto Base: Estructura alineada con Prisma
 */
const excursionBase = z.object({
  // DB: VarChar(255)
  excursionName: z
    .string()
    .min(1, "El nombre de la excursión es obligatorio")
    .max(255, "El nombre no puede superar los 255 caracteres"),

  // DB: VarChar(128)
  origin: z
    .string()
    .min(1, "El origen es obligatorio")
    .max(128, "El origen no puede superar los 128 caracteres"),

  // DB: VarChar(128)
  provider: z
    .string()
    .min(1, "El proveedor es obligatorio")
    .max(128, "El proveedor no puede superar los 128 caracteres"),

  excursionDate: z
    .string()
    .min(1, "La fecha de la excursión es obligatoria")
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "La fecha de la excursión no es válida",
    }),

  // DB: VarChar(128) (Nullable)
  bookingReference: z
    .string()
    .max(128, "La referencia no puede superar los 128 caracteres")
    .optional()
    .or(z.literal("").transform(() => undefined)),

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