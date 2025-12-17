import { z } from "zod";
import { Currency } from "@/lib/interfaces/currency/currency.interface";
// 👇 Importamos la utilidad y la nueva config de error
import { 
  validateMinOneHourGap, 
  dropoffDateErrorConfig,
  validateEndAfterStart,
  dropoffDateMinDurationErrorConfig
} from "@/lib/schemas/utils/date-validations";

const currencyValues = Object.values(Currency) as [Currency, ...Currency[]];

/**
 * 🚗 Base shape: Definimos SOLO la estructura de datos
 */
const carRentalBase = z.object({
  provider: z.string().min(1, "El proveedor es obligatorio"),

  bookingReference: z
    .string()
    .min(1, "La referencia de reserva es obligatoria")
    .optional()
    .or(z.literal("").transform(() => undefined)),

  pickupLocation: z.string().min(1, "El lugar de retiro es obligatorio"),

  dropoffLocation: z.string().min(1, "El lugar de devolución es obligatorio"),

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

  carCategory: z.string().min(1, "La categoría del auto es obligatoria"),

  carModel: z
    .string()
    .min(1, "El modelo es obligatorio")
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
  // 1️⃣ Orden
  .refine(validateEndAfterStart, dropoffDateErrorConfig)
  // 2️⃣ Duración
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