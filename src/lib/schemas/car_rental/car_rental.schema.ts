import { z } from "zod";
import { Currency } from "@/lib/interfaces/currency/currency.interface";
import { 
  validateMinOneHourGap, 
  validateEndAfterStart,
  dropoffDateErrorConfig,
  dropoffDateMinDurationErrorConfig
} from "@/lib/schemas/utils/date-validations";

const currencyValues = Object.values(Currency) as [Currency, ...Currency[]];

/**
 * 🚗 Base shape: Estructura de datos alineada con Prisma
 */
const carRentalBase = z.object({
  // DB: VarChar(128)
  provider: z
    .string()
    .min(1, "El proveedor es obligatorio")
    .max(128, "El proveedor no puede superar los 128 caracteres"),

  // DB: VarChar(255) (Nullable)
  bookingReference: z
    .string()
    .max(255, "La referencia no puede superar los 255 caracteres")
    .optional()
    .or(z.literal("").transform(() => undefined)),

  // DB: VarChar(128)
  pickupLocation: z
    .string()
    .min(1, "El lugar de retiro es obligatorio")
    .max(128, "El lugar de retiro no puede superar los 128 caracteres"),

  // DB: VarChar(128)
  dropoffLocation: z
    .string()
    .min(1, "El lugar de devolución es obligatorio")
    .max(128, "El lugar de devolución no puede superar los 128 caracteres"),

  pickupDate: z
    .string()
    .min(1, "La fecha de retiro es obligatoria")
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "La fecha de retiro no es válida",
    }),

  dropoffDate: z
    .string()
    .min(1, "La fecha de devolución es obligatoria")
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "La fecha de devolución no es válida",
    }),

  // DB: VarChar(128)
  carCategory: z
    .string()
    .min(1, "La categoría del auto es obligatoria")
    .max(128, "La categoría no puede superar los 128 caracteres"),

  // DB: VarChar(255) (Nullable)
  carModel: z
    .string()
    .max(255, "El modelo no puede superar los 255 caracteres")
    .optional()
    .or(z.literal("").transform(() => undefined)),

  totalPrice: z
    .coerce.number()
    .min(0, "El precio total no puede ser negativo"),

  amountPaid: z
    .coerce.number()
    .nonnegative("El monto pagado debe ser positivo"),
});

/**
 * 🟢 CREATE
 */
export const createCarRentalSchema = carRentalBase
  .extend({
    currency: z.enum(currencyValues, { message: "Moneda inválida" }).default(Currency.USD),
    reservationId: z.string().uuid("reservationId inválido"),
  })
  // 1️⃣ Orden: Devolución >= Retiro
  .refine(validateEndAfterStart, dropoffDateErrorConfig)
  // 2️⃣ Duración: Diferencia >= 1 hora
  .refine(validateMinOneHourGap, dropoffDateMinDurationErrorConfig);

/**
 * ✏️ UPDATE
 */
export const updateCarRentalSchema = carRentalBase
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message: "Debes modificar al menos un campo",
    }
  )
  // 1️⃣ Orden
  .refine(validateEndAfterStart, dropoffDateErrorConfig)
  // 2️⃣ Duración
  .refine(validateMinOneHourGap, dropoffDateMinDurationErrorConfig);

// Derivaciones tipadas
export type CarRentalCreateSchema = z.infer<typeof createCarRentalSchema>;
export type CarRentalUpdateSchema = z.infer<typeof updateCarRentalSchema>;