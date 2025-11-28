import { z } from "zod";
import { Currency } from "@/lib/interfaces/currency/currency.interface";

// Si Currency es algo como: type Currency = "USD" | "ARS";
const currencyValues = Object.values(Currency) as [Currency, ...Currency[]];

/**
 * 🚗 Base shape: Definimos SOLO la estructura de datos (z.object).
 * NO aplicamos .refine() aquí todavía para poder usar .extend() después.
 */
const carRentalShape = z.object({
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
    .min(0, "El precio total debe ser mayor o igual a 0"), // Corregido a min(0) para permitir 0 si es necesario, o dejalo en 1

  amountPaid: z
    .coerce.number()
    .nonnegative("El monto pagado debe ser positivo"),
});

/**
 * 🟢 CREATE:
 * 1. Extendemos el shape base.
 * 2. Agregamos currency y reservationId.
 * 3. APLICAMOS EL REFINE AQUÍ (al final).
 */
export const createCarRentalSchema = carRentalShape
  .extend({
    currency: z.enum(currencyValues, { message: "Moneda inválida" }).default(Currency.USD),
    reservationId: z.string().uuid("reservationId inválido"),
  })
  // 🚦 Validación de fechas: dropoffDate >= pickupDate
  .refine(
    (data) => {
      const start = new Date(data.pickupDate);
      const end = new Date(data.dropoffDate);
      return end >= start;
    },
    {
      message: "La fecha de devolución no puede ser anterior a la de retiro",
      path: ["dropoffDate"],
    }
  );

/**
 * ✏️ UPDATE:
 * Usamos el shape base, lo hacemos parcial y validamos que haya cambios.
 * Nota: En updates parciales no solemos validar el rango de fechas porque
 * el usuario podría enviar solo una de las dos fechas.
 */
export const updateCarRentalSchema = carRentalShape.partial().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "Debes modificar al menos un campo",
  },
);

// Derivaciones tipadas
export type CarRentalCreateSchema = z.infer<typeof createCarRentalSchema>;
export type CarRentalUpdateSchema = z.infer<typeof updateCarRentalSchema>;