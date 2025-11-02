import { z } from "zod";
import { Currency } from "@/lib/interfaces/currency/currency.interface";

const currencyValues = Object.values(Currency) as [Currency, ...Currency[]];
/**
 * 🚢 Base para validación de cruceros (sin currency ni reservationId)
 */
const cruiseBase = z
  .object({
    embarkationPort: z
      .string()
      .min(1, "El puerto de embarque es obligatorio"),
    arrivalPort: z.string().optional().nullable(),
    startDate: z
      .string()
      .min(1, "La fecha de salida es obligatoria")
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "La fecha de salida no es válida",
      }),
    endDate: z
      .string()
      .optional()
      .nullable()
      .refine((val) => !val || !isNaN(Date.parse(val)), {
        message: "La fecha de llegada no es válida",
      }),
    bookingReference: z
      .string()
      .min(1, "La referencia de reserva es obligatoria")
      .optional()
      .nullable(),
    provider: z.string().min(1, "La naviera (proveedor) es obligatoria"),
    totalPrice: z.coerce.number().min(1, "El precio total debe ser mayor a 0"),
    amountPaid: z
      .coerce.number()
      .nonnegative("El monto pagado debe ser positivo"),
    notes: z
      .string()
      .max(2000, "Las notas no deben superar los 2000 caracteres")
      .optional()
      .or(z.literal("").transform(() => undefined)),
  })
  // 🚦 coherencia: endDate >= startDate
  .refine(
    (data) => {
      if (!data.endDate) return true;
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return end >= start;
    },
    {
      message: "La fecha de llegada no puede ser anterior a la de salida",
      path: ["endDate"],
    },
  );

/**
 * 🟢 CREATE: incluye currency y reservationId
 */
export const createCruiseSchema = cruiseBase.safeExtend({
  currency: z.enum(currencyValues, { message: "Moneda inválida" }).default(Currency.USD),
  reservationId: z.string().uuid("reservationId inválido"),
});

/**
 * ✏️ UPDATE: todos los campos opcionales, sin currency/reservationId
 * exige que al menos un campo se haya modificado
 */
export const updateCruiseSchema = cruiseBase.partial().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "Debes modificar al menos un campo",
  },
);

// Derivaciones tipadas
export type CruiseCreateSchema = z.infer<typeof createCruiseSchema>;
export type CruiseUpdateSchema = z.infer<typeof updateCruiseSchema>;
