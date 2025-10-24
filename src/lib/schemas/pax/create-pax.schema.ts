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

    passportExpirationDate: z.coerce.date().optional(),

    dniNum: z
      .string()
      .trim()
      .regex(dniRegex, { message: "DNI: debe tener exactamente 8 dígitos" })
      .max(128)
      .optional(),

    dniExpirationDate: z.coerce.date().optional(),
  })
  .superRefine((data, ctx) => {
    const hasPassport = !!data.passportNum;
    const hasDni = !!data.dniNum;

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

    if (hasPassport && !data.passportExpirationDate) {
      ctx.addIssue({
        code: "custom",
        path: ["passportExpirationDate"],
        message: "Debe ingresar fecha de vencimiento del pasaporte",
      });
    }

    if (hasDni && !data.dniExpirationDate) {
      ctx.addIssue({
        code: "custom",
        path: ["dniExpirationDate"],
        message: "Debe ingresar fecha de vencimiento del DNI",
      });
    }
  });

export type CreatePax = z.infer<typeof CreatePaxSchema>;
