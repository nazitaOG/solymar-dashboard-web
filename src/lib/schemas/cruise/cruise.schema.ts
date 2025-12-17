import { z } from "zod";
import { Currency } from "@/lib/interfaces/currency/currency.interface";
import { 
  validateEndAfterStart, 
  endDateErrorConfig 
} from "@/lib/schemas/utils/date-validations";

const currencyValues = Object.values(Currency) as [Currency, ...Currency[]];

// 🚢 BASE: Campos comunes
const cruiseBase = z.object({
  embarkationPort: z.string().min(1, "El puerto de embarque es obligatorio"),
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
  totalPrice: z.coerce.number().min(0, "El precio no puede ser negativo"),
  amountPaid: z.coerce.number().nonnegative("El monto pagado debe ser positivo"),
  notes: z
    .string()
    .max(2000, "Las notas no deben superar los 2000 caracteres")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

// 🟢 CREATE
export const createCruiseSchema = cruiseBase
  .extend({
    currency: z.enum(currencyValues, { message: "Moneda inválida" }).default(Currency.USD),
    reservationId: z.string().uuid("ID de reserva inválido"),
  })
  // Validar fechas
  .refine(validateEndAfterStart, endDateErrorConfig);

// ✏️ UPDATE
export const updateCruiseSchema = cruiseBase
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debes modificar al menos un campo",
  })
  // Validar fechas
  .refine(validateEndAfterStart, endDateErrorConfig);

// Tipos
export type CruiseCreateSchema = z.infer<typeof createCruiseSchema>;
export type CruiseUpdateSchema = z.infer<typeof updateCruiseSchema>;