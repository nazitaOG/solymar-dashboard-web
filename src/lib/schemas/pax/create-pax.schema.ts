import { z } from "zod";

const passportRegex = /^[A-Za-z0-9]{6,9}$/;
const dniRegex = /^\d{8}$/;

const today = new Date();
today.setHours(0, 0, 0, 0);

const maxBirthDate = new Date();
maxBirthDate.setMonth(maxBirthDate.getMonth() + 9);
maxBirthDate.setHours(0, 0, 0, 0);

export const CreatePaxSchema = z
  .object({
    name: z.string().trim().min(1, "El nombre no puede estar vacío").max(128),

    birthDate: z
      .string()
      .min(1, "La fecha de nacimiento es obligatoria")
      .transform((v) => new Date(v))
      .refine(
        (v) => {
          if (!v) return true;
          return v <= maxBirthDate;
        },
        { message: "La fecha de nacimiento no puede ser posterior a 9 meses desde hoy." }
      ),
      
    nationality: z
      .string()
      .trim()
      .min(1, "La nacionalidad es obligatoria")
      .max(128, "Máximo 128 caracteres")
      .transform((v) => v.toUpperCase()),

    // ------------------------
    // PASAPORTE
    // ------------------------
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
      .optional()
      .refine(
        (v) => {
          if (!v) return true;
          return v >= today;
        },
        { message: "La fecha de vencimiento no puede ser anterior a hoy." }
      ),

    // ------------------------
    // DNI
    // ------------------------
    dniNum: z
      .string()
      .trim()
      .regex(dniRegex, { message: "DNI: debe tener exactamente 8 dígitos" })
      .max(128)
      .optional(),

    dniExpirationDate: z
      .union([z.coerce.date(), z.literal("")])
      .transform((v) => (v === "" ? undefined : v))
      .optional()
      .refine(
        (v) => {
          if (!v) return true;
          return v >= today;
        },
        { message: "La fecha de vencimiento no puede ser anterior a hoy." }
      ),
  })
  .superRefine((data, ctx) => {
    const hasPassport = !!data.passportNum;
    const hasDni = !!data.dniNum;

    // Regla 1: debe venir al menos un documento
    if (!hasPassport && !hasDni) {
      ctx.addIssue({
        code: "custom",
        path: ["passportNum"],
        message: "Debe ingresar DNI o Pasaporte.",
      });
      ctx.addIssue({
        code: "custom",
        path: ["dniNum"],
        message: "Debe ingresar DNI o Pasaporte.",
      });
    }

    // Regla 2: no permitir fecha sin número
    if (!hasPassport && data.passportExpirationDate) {
      ctx.addIssue({
        code: "custom",
        path: ["passportExpirationDate"],
        message: "No puede ingresar fecha de pasaporte sin número de pasaporte.",
      });
    }

    if (!hasDni && data.dniExpirationDate) {
      ctx.addIssue({
        code: "custom",
        path: ["dniExpirationDate"],
        message: "No puede ingresar fecha de DNI sin número de DNI.",
      });
    }
  });

export type CreatePax = z.infer<typeof CreatePaxSchema>;
