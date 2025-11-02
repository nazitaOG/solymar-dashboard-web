import { z } from "zod";
import { Currency } from "@/lib/interfaces/currency/currency.interface";

// 💰 Si Currency es algo como: type Currency = "USD" | "ARS";
const currencyValues = Object.values(Currency) as [Currency, ...Currency[]];

/**
 * 🏝️ Base de validación para excursiones (sin currency ni reservationId)
 */
const excursionBase = z
  .object({
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

    totalPrice: z
      .coerce.number()
      .min(1, "El precio total debe ser mayor a 0"),

    amountPaid: z
      .coerce.number()
      .nonnegative("El monto pagado debe ser positivo"),
  })
  // 🚦 coherencia de montos
  .refine(
    (data) => data.amountPaid <= data.totalPrice,
    {
      message: "El monto pagado no puede ser mayor que el total",
      path: ["amountPaid"],
    },
  );

/**
 * 🟢 CREATE: incluye currency y reservationId
 */
export const createExcursionSchema = excursionBase.safeExtend({
  currency: z.enum(currencyValues, { message: "Moneda inválida" }).default(Currency.USD),
  reservationId: z.string().uuid("reservationId inválido"),
});

/**
 * ✏️ UPDATE: todos los campos opcionales, sin currency/reservationId
 * exige que al menos un campo se haya modificado
 */
export const updateExcursionSchema = excursionBase.partial().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "Debes modificar al menos un campo",
  },
);

// 🧩 Derivaciones tipadas
export type ExcursionCreateSchema = z.infer<typeof createExcursionSchema>;
export type ExcursionUpdateSchema = z.infer<typeof updateExcursionSchema>;
