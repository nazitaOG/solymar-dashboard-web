import { z } from "zod"

/**
 * 🧩 Esquema Zod equivalente al LoginUserDto del backend.
 * 
 * - email → string no vacío, trim, lowercase, máx. 128 caracteres
 * - password → string no vacío, máx. 64 caracteres
 * 
 * El objetivo es que este esquema sea 100% isomórfico al DTO backend,
 * evitando inconsistencias en validación.
 */
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "El email es obligatorio.")
    .max(128, "El email no puede superar los 128 caracteres.")
    .email("Debe ser un email válido."),

  password: z
    .string()
    .trim()
    .min(1, "La contraseña es obligatoria.")
    .max(64, "La contraseña no puede superar los 64 caracteres."),
})

export type LoginSchema = z.infer<typeof loginSchema>
