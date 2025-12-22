import { z } from "zod"

// Misma regex que usamos en el Backend (Single Source of Truth conceptual)
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])[\s\S]{8,}$/

const passwordErrorMsg = "La contraseña debe tener al menos 8 caracteres, 1 mayúscula, 1 minúscula, 1 número y 1 símbolo."

/**
 * 🔐 Login Schema
 * Solo validamos que sea string y longitud.
 * NO validamos regex aquí (por si cambiamos reglas a futuro y hay usuarios legacy).
 * NO hacemos trim() al password.
 */
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "El email es obligatorio.")
    .max(128)
    .email("Debe ser un email válido."),

  password: z
    .string()
    // .trim() <--- REMOVIDO: Las contraseñas pueden tener espacios
    .min(1, "La contraseña es obligatoria.")
    .max(64, "La contraseña es demasiado larga."),
})

/**
 * 📧 Forgot Password Schema
 * Solo validamos el email.
 */
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "El email es obligatorio.")
    .email("Debe ser un email válido."),
})

/**
 * 🔄 Reset Password Schema
 * Aquí SÍ validamos la regex fuerte y la confirmación.
 */
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token inválido."),
    password: z
      .string()
      .min(8, "Mínimo 8 caracteres.")
      .max(64)
      .regex(PASSWORD_REGEX, passwordErrorMsg),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"], // El error aparecerá en este campo
  })

// Tipos inferidos para usar en tus componentes
export type LoginSchema = z.infer<typeof loginSchema>
export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>