import { z } from "zod";
import { Currency } from "@/lib/interfaces/currency/currency.interface";
import { TransportType } from "@/lib/interfaces/transfer/transfer.interface";
import { 
  validateMinOneHourGap, 
  validateEndAfterStart,
  arrivalDateErrorConfig,
  arrivalDateMinDurationErrorConfig
} from "@/lib/schemas/utils/date-validations";

const currencyValues = Object.values(Currency) as [Currency, ...Currency[]];
const transportValues = Object.values(TransportType) as [TransportType, ...TransportType[]];

/**
 * 🚐 Objeto Base: Estructura alineada con Prisma
 */
const transferBase = z.object({
  // DB: VarChar(128)
  origin: z
    .string()
    .min(1, "El origen es obligatorio")
    .max(128, "El origen no puede superar los 128 caracteres"),

  // DB: VarChar(128) (Nullable)
  destination: z
    .string()
    .max(128, "El destino no puede superar los 128 caracteres")
    .optional()
    .or(z.literal("").transform(() => undefined)), 

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

  // DB: VarChar(128) (Nullable) - OJO: Aquí es 128, no 255
  bookingReference: z
    .string()
    .max(128, "La referencia no puede superar los 128 caracteres")
    .optional()
    .or(z.literal("").transform(() => undefined)),

  // DB: VarChar(128)
  provider: z
    .string()
    .min(1, "El proveedor es obligatorio")
    .max(128, "El proveedor no puede superar los 128 caracteres"),

  totalPrice: z.coerce.number().min(0, "El precio no puede ser negativo"),

  amountPaid: z.coerce.number().nonnegative("El monto pagado debe ser positivo"),

  transportType: z.enum(transportValues, {
    message: "Tipo de transporte inválido",
  }),
});

/**
 * 🟢 CREATE
 */
export const createTransferSchema = transferBase
  .extend({
    currency: z.enum(currencyValues, { message: "Moneda inválida" }).default(Currency.USD),
    reservationId: z.string().uuid("ID de reserva inválido"),
  })
  // 1️⃣ Orden: Llegada >= Salida
  .refine(validateEndAfterStart, arrivalDateErrorConfig)
  // 2️⃣ Duración: Diferencia >= 1 hora
  .refine(validateMinOneHourGap, arrivalDateMinDurationErrorConfig);

/**
 * ✏️ UPDATE
 */
export const updateTransferSchema = transferBase
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message: "Debes modificar al menos un campo",
    },
  )
  // 1️⃣ Orden
  .refine(validateEndAfterStart, arrivalDateErrorConfig)
  // 2️⃣ Duración
  .refine(validateMinOneHourGap, arrivalDateMinDurationErrorConfig);

// Derivaciones tipadas
export type TransferCreateSchema = z.infer<typeof createTransferSchema>;
export type TransferUpdateSchema = z.infer<typeof updateTransferSchema>;