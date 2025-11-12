import { z } from "zod";

// ------------------------------------
// Patrones de documento por país
// ------------------------------------
const dniPatterns = {
  Argentina: /^\d{7,8}$/, // 7–8 dígitos
  Uruguay: /^\d{1,8}-?\d$/, // hasta 8 dígitos + guion opcional
  Chile: /^\d{7,8}-[0-9Kk]$/, // 7–8 dígitos + guion + dígito o K
  Brasil: /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, // 11 dígitos con o sin separadores
  Paraguay: /^\d{6,8}$/, // 6–8 dígitos
  Perú: /^\d{8}$/, // exactamente 8 dígitos
  Bolivia: /^[A-Z0-9]{5,9}$/i, // 5–9 alfanuméricos
  Otro: /^[A-Za-z0-9]{4,15}$/, // 4–15 alfanuméricos genéricos
} as const;

// ------------------------------------
// Fechas base (hoy y límite de nacimiento)
// ------------------------------------
const today = new Date();
today.setHours(0, 0, 0, 0);

const maxBirthDate = new Date(today);
maxBirthDate.setMonth(maxBirthDate.getMonth() + 9);

// ------------------------------------
// Schema principal
// ------------------------------------
export const CreatePaxSchema = z
  .object({
    // Información básica
    name: z
      .string()
      .trim()
      .min(1, "El nombre no puede estar vacío")
      .max(128),

    birthDate: z
      .string()
      .min(1, "La fecha de nacimiento es obligatoria")
      .transform((v) => new Date(v))
      .refine((v) => v <= maxBirthDate, {
        message:
          "La fecha de nacimiento no puede ser posterior a 9 meses desde hoy.",
      }),

    nationality: z
      .string()
      .trim()
      .min(1, "La nacionalidad es obligatoria")
      .max(128)
      .transform((v) => v.toUpperCase()),

    // PASAPORTE
    passportNum: z
      .string()
      .trim()
      .regex(/^[A-Za-z0-9]{6,9}$/, {
        message: "Passport: debe ser alfanumérico de 6 a 9 caracteres",
      })
      .max(128)
      .transform((v) => v.toUpperCase())
      .optional(),

    passportExpirationDate: z
      .union([z.coerce.date(), z.literal("")])
      .transform((v) => (v === "" ? undefined : v))
      .optional()
      .refine((v) => !v || v >= today, {
        message: "La fecha de vencimiento no puede ser anterior a hoy.",
      }),

    // DNI
    dniNum: z.string().trim().optional(),

    dniExpirationDate: z
      .union([z.coerce.date(), z.literal("")])
      .transform((v) => (v === "" ? undefined : v))
      .optional()
      .refine((v) => !v || v >= today, {
        message: "La fecha de vencimiento no puede ser anterior a hoy.",
      }),
  })
  .superRefine((data, ctx) => {
    const hasPassport = !!data.passportNum;
    const hasDni = !!data.dniNum;

    // 1️⃣ Al menos un documento
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

    // 2️⃣ Validar formato de DNI según país
    if (data.dniNum) {
      const nationalityKey = Object.keys(dniPatterns).find(
        (k) => k.toUpperCase() === data.nationality.toUpperCase()
      ) as keyof typeof dniPatterns;
    
      const regex = nationalityKey ? dniPatterns[nationalityKey] : dniPatterns.Otro;
    
      if (!regex.test(data.dniNum.trim())) {
        ctx.addIssue({
          code: "custom",
          path: ["dniNum"],
          message: `El formato del documento no es válido para el país seleccionado: ${data.nationality}.`,
        });
      }
    }
    

    // 3️⃣ No permitir fecha sin número
    if (!hasPassport && data.passportExpirationDate) {
      ctx.addIssue({
        code: "custom",
        path: ["passportExpirationDate"],
        message:
          "No puede ingresar fecha de pasaporte sin número de pasaporte.",
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
