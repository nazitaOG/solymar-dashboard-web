import { z } from "zod";
import { Currency } from "@/lib/interfaces/currency/currency.interface";
import { TransportType } from "@/lib/interfaces/transfer/transfer.interface";

// Si Currency es algo como: type Currency = "USD" | "ARS";
const currencyValues = Object.values(Currency) as [Currency, ...Currency[]];

// 🎯 Tipos de transporte válidos
const transportValues = Object.values(TransportType) as [TransportType, ...TransportType[]];


/**
 * 🚐 Base para validación de traslados (sin currency ni reservationId)
 * - Valida coherencia de fechas (arrivalDate >= departureDate)
 * - Valida campos obligatorios de negocio
 */
const transferBase = z
  .object({
    origin: z.string().min(1, "El origen es obligatorio"),
    destination: z
      .string()
      .min(1, "El destino es obligatorio")
      .optional()
      .or(z.literal("").transform(() => undefined)), // destino puede omitirse

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

    totalPrice: z
      .coerce.number()
      .min(1, "El precio total debe ser mayor a 0"),

    amountPaid: z
      .coerce.number()
      .nonnegative("El monto pagado debe ser positivo"),

    transportType: z.enum(transportValues, {
      message: "Tipo de transporte inválido",
    }),
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
export const createTransferSchema = transferBase.safeExtend({
  currency: z.enum(currencyValues, { message: "Moneda inválida" }).default(Currency.USD),
  reservationId: z.string().uuid("reservationId inválido"),
});

/**
 * ✏️ UPDATE: todos los campos opcionales, sin currency/reservationId
 * exige que al menos un campo se haya modificado
 */
export const updateTransferSchema = transferBase.partial().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "Debes modificar al menos un campo",
  },
);

// Derivaciones tipadas
export type TransferCreateSchema = z.infer<typeof createTransferSchema>;
export type TransferUpdateSchema = z.infer<typeof updateTransferSchema>;
