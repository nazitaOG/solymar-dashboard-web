import { z } from "zod";
import { Currency } from "@/lib/interfaces/currency/currency.interface";
import { 
  validateEndAfterStart, 
  endDateErrorConfig 
} from "@/lib/schemas/utils/date-validations";

const currencyValues = Object.values(Currency) as [Currency, ...Currency[]];

// 🚢 BASE: Campos comunes alineados con Prisma
const cruiseBase = z.object({
  // DB: VarChar(128)
  embarkationPort: z
    .string()
    .min(1, "El puerto de embarque es obligatorio")
    .max(128, "El puerto no puede tener más de 128 caracteres"),

  // DB: String? @db.VarChar(128)
  arrivalPort: z
    .string()
    .max(128, "El puerto no puede tener más de 128 caracteres")
    .optional()
    .nullable()
    .or(z.literal("").transform(() => null)), // Transforma string vacío a null

  startDate: z
    .string()
    .min(1, "La fecha de salida es obligatoria")
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "La fecha de salida no es válida",
    }),

  // DB: DateTime?
  endDate: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: "La fecha de llegada no es válida",
    }),

  // DB: String? @db.VarChar(255)
  bookingReference: z
    .string()
    .max(255, "La referencia no puede tener más de 255 caracteres")
    .optional()
    .nullable()
    .or(z.literal("").transform(() => null)),

  // DB: VarChar(128)
  provider: z
    .string()
    .min(1, "La naviera (proveedor) es obligatoria")
    .max(128, "El proveedor no puede tener más de 128 caracteres"),

  totalPrice: z.coerce.number().min(0, "El precio no puede ser negativo"),
  amountPaid: z.coerce.number().nonnegative("El monto pagado debe ser positivo"),
  
  // ❌ 'notes' ELIMINADO: No existe en el modelo Cruise de Prisma
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