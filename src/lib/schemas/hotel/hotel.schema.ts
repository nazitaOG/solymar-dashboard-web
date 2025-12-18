import { z } from "zod";
import { Currency } from "@/lib/interfaces/currency/currency.interface";
import { 
  validateEndAfterStart, 
  endDateErrorConfig 
} from "@/lib/schemas/utils/date-validations";

const currencyValues = Object.values(Currency) as [Currency, ...Currency[]];

// 🏨 BASE: Campos comunes alineados con Prisma
const hotelBase = z.object({
  startDate: z.string().min(1, "La fecha de entrada es obligatoria"),
  
  endDate: z.string().min(1, "La fecha de salida es obligatoria"),
  
  // DB: VarChar(128)
  city: z
    .string()
    .min(1, "La ciudad es obligatoria")
    .max(128, "La ciudad no puede superar los 128 caracteres"),
  
  // DB: VarChar(255)
  hotelName: z
    .string()
    .min(1, "El nombre del hotel es obligatorio")
    .max(255, "El nombre del hotel no puede superar los 255 caracteres"),
  
  // DB: VarChar(255) - OBLIGATORIO según Prisma
  bookingReference: z
    .string()
    .min(1, "La referencia de reserva es obligatoria")
    .max(255, "La referencia no puede superar los 255 caracteres"),
  
  totalPrice: z.coerce.number().min(0, "El precio no puede ser negativo"),
  
  amountPaid: z.coerce.number().nonnegative("El monto pagado debe ser positivo"),
  
  // DB: VarChar(255)
  roomType: z
    .string()
    .min(1, "El tipo de habitación es obligatorio")
    .max(255, "El tipo de habitación no puede superar los 255 caracteres")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  
  // DB: VarChar(128)
  provider: z
    .string()
    .min(1, "El proveedor es obligatorio")
    .max(128, "El proveedor no puede superar los 128 caracteres"),
});

// 🟢 CREATE
export const createHotelSchema = hotelBase
  .extend({
    currency: z.enum(currencyValues, { message: "Moneda inválida" }).default(Currency.USD),
    reservationId: z.string().uuid("ID de reserva inválido"),
  })
  // Validar fechas: End >= Start
  .refine(validateEndAfterStart, endDateErrorConfig);

// ✏️ UPDATE
export const updateHotelSchema = hotelBase
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debes modificar al menos un campo",
  })
  // Validar fechas: End >= Start
  .refine(validateEndAfterStart, endDateErrorConfig);

// Tipos derivados
export type HotelCreateSchema = z.infer<typeof createHotelSchema>;
export type HotelUpdateSchema = z.infer<typeof updateHotelSchema>;