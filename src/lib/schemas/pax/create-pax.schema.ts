import { z } from "zod";

const passportRegex = /^[A-Za-z0-9]{6,9}$/;
const dniRegex = /^\d{8}$/;

export const CreatePaxSchema = z
  .object({
    name: z.string().trim().min(1, "El nombre no puede estar vacío").max(128),

    birthDate: z
      .string()
      .min(1, "La fecha de nacimiento es obligatoria")
      .transform((v) => new Date(v)),

    nationality: z
      .string()
      .trim()
      .min(1, "La nacionalidad es obligatoria")
      .max(128, "Máximo 128 caracteres")
      .transform((v) => v.toUpperCase()),

    passportNum: z
      .string()
      .trim()
      .regex(passportRegex, {
        message: "Passport: debe ser alfanumérico de 6 a 9 caracteres",
      })
      .max(128)
      .transform((v) => v.toUpperCase())
      .optional(),

    passportExpirationDate: z
      .union([z.coerce.date(), z.literal("")])
      .transform((v) => (v === "" ? undefined : v))
      .optional(),

    dniNum: z
      .string()
      .trim()
      .regex(dniRegex, { message: "DNI: debe tener exactamente 8 dígitos" })
      .max(128)
      .optional(),

    dniExpirationDate: z
      .union([z.coerce.date(), z.literal("")])
      .transform((v) => (v === "" ? undefined : v))
      .optional(),

  })
  .superRefine((data, ctx) => {
    const hasPassport = !!data.passportNum;
    const hasDni = !!data.dniNum;

    // 🔹 Regla 1: debe venir al menos uno
    if (!hasPassport && !hasDni) {
      ctx.addIssue({
        code: "custom",
        path: ["passportNum"],
        message: "Debe ingresar DNI o Pasaporte",
      });
      ctx.addIssue({
        code: "custom",
        path: ["dniNum"],
        message: "Debe ingresar DNI o Pasaporte",
      });
    }

    // 🔹 Regla 2: fechas NO permitidas sin documento
    if (!hasPassport && data.passportExpirationDate) {
      ctx.addIssue({
        code: "custom",
        path: ["passportExpirationDate"],
        message: "No puede ingresar fecha de pasaporte sin número de pasaporte",
      });
    }

    if (!hasDni && data.dniExpirationDate) {
      ctx.addIssue({
        code: "custom",
        path: ["dniExpirationDate"],
        message: "No puede ingresar fecha de DNI sin número de DNI",
      });
    }
  });

export type CreatePax = z.infer<typeof CreatePaxSchema>;
