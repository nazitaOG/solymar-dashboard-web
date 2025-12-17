import { z } from "zod";
import { Currency } from "@/lib/interfaces/currency/currency.interface";
import { TransportType } from "@/lib/interfaces/transfer/transfer.interface";
// 👇 Importamos la utilidad y la config específica para "arrivalDate"
import { 
  validateMinOneHourGap, 
  arrivalDateErrorConfig,
  validateEndAfterStart,
  arrivalDateMinDurationErrorConfig
} from "@/lib/schemas/utils/date-validations";

const currencyValues = Object.values(Currency) as [Currency, ...Currency[]];
const transportValues = Object.values(TransportType) as [TransportType, ...TransportType[]];

/**
 * 🚐 Objeto Base (Sin .refine todavía)
 */
const transferBase = z.object({
  origin: z.string().min(1, "El origen es obligatorio"),
  destination: z
    .string()
    .min(1, "El destino es obligatorio")
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

  bookingReference: z
    .string()
    .min(1, "La referencia de reserva es obligatoria")
    .optional()
    .or(z.literal("").transform(() => undefined)),

  provider: z.string().min(1, "El proveedor es obligatorio"),

  // Ajustado a min(0) para consistencia (no negativos, permite gratis)
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
    reservationId: z.string().uuid("reservationId inválido"),
  })
  // 👇 Usamos la utilidad con la config de error para "arrivalDate"
  .refine(validateEndAfterStart, arrivalDateErrorConfig)
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