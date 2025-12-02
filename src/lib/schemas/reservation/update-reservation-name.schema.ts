import { z } from "zod";

/**
 * 📝 Base shape: Definimos SOLO la estructura del nombre.
 */
const reservationNameShape = z.object({
  name: z
    .string()
    .trim() // Sanea espacios al inicio/final
    .min(1, "El nombre de la reserva es obligatorio") // Validación principal: No vacío
    .max(100, "El nombre es demasiado largo (máx 100 caracteres)"),
});

/**
 * ✏️ UPDATE SCHEMA:
 * En este caso es igual al shape base.
 * Lo exportamos explícitamente siguiendo tu patrón.
 */
export const updateReservationNameSchema = reservationNameShape;

// 🧠 Derivación de tipos
export type UpdateReservationNameSchema = z.infer<typeof updateReservationNameSchema>;