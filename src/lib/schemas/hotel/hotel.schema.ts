// src/lib/schemas/hotel/hotel.schema.ts
import { z } from "zod";
import { Currency } from "@/lib/interfaces/currency/currency.interface";

// ✅ si Currency es un tipo como type Currency = "USD" | "ARS";
const currencyValues = Object.values(Currency) as [Currency, ...Currency[]];
// Base sin currency ni reservationId
const hotelBase = z.object({
  startDate: z.string().min(1, "La fecha de entrada es obligatoria"),
  endDate: z.string().min(1, "La fecha de salida es obligatoria"),
  city: z.string().min(1, "La ciudad es obligatoria"),
  hotelName: z.string().min(1, "El nombre del hotel es obligatorio"),
  bookingReference: z.string().min(1, "La referencia de reserva es obligatoria"),
  totalPrice: z.coerce.number().min(1, "El precio debe ser mayor a 0"),
  amountPaid: z.coerce.number().nonnegative("El monto debe ser positivo"),
  roomType: z.string().min(1, "El tipo de habitación es obligatorio"),
  provider: z.string().min(1, "El proveedor es obligatorio"),
});

// 🟢 CREATE: incluye currency y reservationId
export const createHotelSchema = hotelBase.extend({
  currency: z
    .enum(currencyValues, "Moneda inválida")
    .default(Currency.USD),
});

// ✏️ UPDATE: sin currency/reservationId y parcial
export const updateHotelSchema = hotelBase
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debes modificar al menos un campo",
  });

// Tipos derivados
export type HotelCreateSchema = z.infer<typeof createHotelSchema>;
export type HotelUpdateSchema = z.infer<typeof updateHotelSchema>;
