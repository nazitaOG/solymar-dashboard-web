import { z } from "zod";
import { Currency } from "@/lib/interfaces/currency/currency.interface";
import { 
  validateEndAfterStart, 
  endDateErrorConfig 
} from "@/lib/schemas/utils/date-validations";

const currencyValues = Object.values(Currency) as [Currency, ...Currency[]];

// 🏨 BASE: Campos comunes
const hotelBase = z.object({
  startDate: z.string().min(1, "La fecha de entrada es obligatoria"),
  endDate: z.string().min(1, "La fecha de salida es obligatoria"),
  city: z.string().min(1, "La ciudad es obligatoria"),
  hotelName: z.string().min(1, "El nombre del hotel es obligatorio"),
  bookingReference: z.string().min(1, "La referencia de reserva es obligatoria"),
  totalPrice: z.coerce.number().min(0, "El precio no puede ser negativo"),
  amountPaid: z.coerce.number().nonnegative("El monto debe ser positivo"),
  roomType: z.string().min(1, "El tipo de habitación es obligatorio"),
  provider: z.string().min(1, "El proveedor es obligatorio"),
});

// 🟢 CREATE
export const createHotelSchema = hotelBase
  .extend({
    currency: z.enum(currencyValues, { message: "Moneda inválida" }).default(Currency.USD),
    reservationId: z.string().uuid("ID de reserva inválido"),
  })
  // Validar fechas
  .refine(validateEndAfterStart, endDateErrorConfig);

// ✏️ UPDATE
export const updateHotelSchema = hotelBase
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debes modificar al menos un campo",
  })
  // Validar fechas
  .refine(validateEndAfterStart, endDateErrorConfig);

// Tipos
export type HotelCreateSchema = z.infer<typeof createHotelSchema>;
export type HotelUpdateSchema = z.infer<typeof updateHotelSchema>;