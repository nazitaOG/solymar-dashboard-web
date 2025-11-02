import { z } from "zod";
import { Currency } from "@/lib/interfaces/currency/currency.interface";

// Si Currency es algo como: type Currency = "USD" | "ARS";
const currencyValues = Object.values(Currency) as [Currency, ...Currency[]];

/**
 * ✈️ Base para validación de vuelos (sin currency ni reservationId)
 */
const planeBase = z
  .object({
    departure: z.string().min(1, "El origen es obligatorio"),
    arrival: z.string().min(1, "El destino es obligatorio"),
    departureDate: z
      .string()
      .min(1, "La fecha de salida es obligatoria")
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "La fecha de salida no es válida",
      }),
    arrivalDate: z
      .string()
      .min(1, "La fecha de llegada es obligatoria")
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "La fecha de llegada no es válida",
      }),
    bookingReference: z
      .string()
      .min(1, "La referencia de reserva es obligatoria"),
    provider: z.string().min(1, "La aerolínea es obligatoria"),
    totalPrice: z.coerce.number().min(1, "El precio total debe ser mayor a 0"),
    amountPaid: z
      .coerce.number()
      .nonnegative("El monto pagado debe ser positivo"),
    notes: z
      .string()
      .max(2000, "Las notas no deben superar los 2000 caracteres")
      .optional()
      .or(z.literal("").transform(() => undefined)), // permite vacío
  })
  // 🚦 coherencia: arrivalDate >= departureDate
  .refine(
    (data) => {
      const start = new Date(data.departureDate);
      const end = new Date(data.arrivalDate);
      return end >= start;
    },
    {
      message: "La fecha de llegada no puede ser anterior a la de salida",
      path: ["arrivalDate"],
    },
  );

/**
 * 🟢 CREATE: incluye currency y reservationId
 */
export const createPlaneSchema = planeBase.safeExtend({
  currency: z.enum(currencyValues, { message: "Moneda inválida" }).default(Currency.USD),
  reservationId: z.string().uuid("reservationId inválido"),
});

/**
 * ✏️ UPDATE: todos los campos opcionales, sin currency/reservationId
 * exige que al menos un campo se haya modificado
 */
export const updatePlaneSchema = planeBase.partial().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "Debes modificar al menos un campo",
  },
);

// Derivaciones tipadas
export type PlaneCreateSchema = z.infer<typeof createPlaneSchema>;
export type PlaneUpdateSchema = z.infer<typeof updatePlaneSchema>;
