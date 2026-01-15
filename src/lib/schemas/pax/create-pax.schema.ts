import { z } from "zod";

// ------------------------------------
// 1. Patrones de documento por país (LIMPIOS)
// ------------------------------------
// Estas Regex esperan datos SANITIZADOS (sin puntos, guiones ni espacios)
const dniPatterns = {
  Argentina: /^\d{7,8}$/,             // 7 u 8 dígitos
  Uruguay: /^\d{7,9}$/,               // Solo dígitos (incl. verificador)
  Chile: /^\d{7,8}[0-9K]$/,           // Dígitos + K
  Brasil: /^\d{11}$/,                 // 11 dígitos (CPF)
  Paraguay: /^\d{6,8}$/,              // Solo dígitos
  Perú: /^\d{8}$/,                    // 8 dígitos exactos
  Bolivia: /^[A-Z0-9]{5,9}$/,         // Alfanumérico
  Otro: /^[A-Z0-9]{4,15}$/,           // Genérico
} as const;

// ------------------------------------
// 2. Fechas base
// ------------------------------------
const today = new Date();
today.setHours(0, 0, 0, 0);

const maxBirthDate = new Date(today);
maxBirthDate.setMonth(maxBirthDate.getMonth() + 9);

// ------------------------------------
// 3. Schema principal
// ------------------------------------
export const CreatePaxSchema = z
  .object({
    // --- Información básica ---
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
        message: "La fecha de nacimiento no puede ser posterior a 9 meses desde hoy.",
      }),

    phoneNumber: z
      .string()
      .trim()
      .optional()
      .transform((val) => (val === "" ? undefined : val)) // 1. Si es vacío, lo vuelve undefined
      .pipe(z.string().min(8, "El teléfono debe tener al menos 8 dígitos").optional()),

    email: z
      .string()
      .trim()
      .toLowerCase() // Buena práctica: normalizar emails a minúsculas
      .optional()
      .transform((val) => (val === "" ? undefined : val)) // 1. Si es vacío, lo vuelve undefined
      .pipe(z.string().email("El formato del email no es correcto").optional()), // 2. Valida

    nationality: z
      .string()
      .trim()
      .min(1, "La nacionalidad es obligatoria")
      .max(128)
      .transform((v) => v.toUpperCase()),

    // --- PASAPORTE (Sanitizado) ---
    passportNum: z
      .string()
      .trim()
      .optional() // 1. Aceptamos undefined
      .or(z.literal("")) // 2. Aceptamos string vacío
      .transform((val) => {
        // 3. Limpieza profunda
        if (!val) return undefined;
        // Quitamos todo lo que no sea alfanumérico
        const cleaned = val.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
        // Si quedó vacío después de limpiar, devolvemos undefined
        return cleaned === "" ? undefined : cleaned;
      })
      // 4. Validación (se ejecuta sobre el string limpio)
      .refine((val) => !val || /^[A-Z0-9]{6,9}$/.test(val), {
        message: "Passport: debe tener entre 6 y 9 caracteres alfanuméricos.",
      }),

    passportExpirationDate: z
      .union([z.coerce.date(), z.literal("")])
      .transform((v) => (v === "" ? undefined : v))
      .optional()
      .refine((v) => !v || v >= today, {
        message: "La fecha de vencimiento no puede ser anterior a hoy.",
      }),

    // --- DNI (Sanitizado) ---
    dniNum: z
      .string()
      .trim()
      .optional()
      .or(z.literal(""))
      .transform((val) => {
        // Limpieza profunda: quita puntos, guiones, espacios
        if (!val) return undefined;
        const cleaned = val.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
        return cleaned === "" ? undefined : cleaned;
      }),

    dniExpirationDate: z
      .union([z.coerce.date(), z.literal("")])
      .transform((v) => (v === "" ? undefined : v))
      .optional()
      .refine((v) => !v || v >= today, {
        message: "La fecha de vencimiento no puede ser anterior a hoy.",
      }),
  })
  .superRefine((data, ctx) => {
    // Normalizamos booleans (data.dniNum y passportNum ya vienen limpios o undefined)
    const hasPassportNum = !!data.passportNum;
    const hasPassportDate = !!data.passportExpirationDate;

    const hasDniNum = !!data.dniNum;
    const hasDniDate = !!data.dniExpirationDate;

    // 1️⃣ REGLA DE INTEGRIDAD: Si pones Número, necesitas Fecha (y viceversa)

    // --- Validación DNI ---
    if (hasDniNum && !hasDniDate) {
      ctx.addIssue({
        code: "custom",
        path: ["dniExpirationDate"],
        message: "Si ingresa número de DNI, la fecha de vencimiento es obligatoria.",
      });
    }
    if (!hasDniNum && hasDniDate) {
      ctx.addIssue({
        code: "custom",
        path: ["dniNum"],
        message: "Si ingresa fecha de vencimiento, el número de DNI es obligatorio.",
      });
    }

    // --- Validación Pasaporte ---
    if (hasPassportNum && !hasPassportDate) {
      ctx.addIssue({
        code: "custom",
        path: ["passportExpirationDate"],
        message: "Si ingresa número de pasaporte, la fecha de vencimiento es obligatoria.",
      });
    }
    if (!hasPassportNum && hasPassportDate) {
      ctx.addIssue({
        code: "custom",
        path: ["passportNum"],
        message: "Si ingresa fecha de vencimiento, el número de pasaporte es obligatorio.",
      });
    }

    // 2️⃣ REGLA MÍNIMA: Al menos un documento COMPLETO
    const hasCompleteDni = hasDniNum && hasDniDate;
    const hasCompletePassport = hasPassportNum && hasPassportDate;

    if (!hasCompleteDni && !hasCompletePassport) {
      // Si no hay ninguno completo, verificamos si al menos intentó llenar uno
      if (!hasDniNum && !hasPassportNum) {
        ctx.addIssue({
          code: "custom",
          path: ["dniNum"],
          message: "Debe completar al menos un documento (DNI o Pasaporte).",
        });
      }
    }

    // 3️⃣ FORMATO DNI POR PAÍS (Sobre el dato limpio)
    if (hasDniNum) {
      const nationalityKey = Object.keys(dniPatterns).find(
        (k) => k.toUpperCase() === data.nationality.toUpperCase()
      ) as keyof typeof dniPatterns;

      // Si no encuentra la nacionalidad, usa 'Otro'
      const regex = nationalityKey ? dniPatterns[nationalityKey] : dniPatterns.Otro;

      // data.dniNum ya no tiene puntos ni guiones
      if (!regex.test(data.dniNum!)) {
        ctx.addIssue({
          code: "custom",
          path: ["dniNum"],
          message: `Formato inválido para ${data.nationality}.`,
        });
      }
    }
  });

export type CreatePax = z.infer<typeof CreatePaxSchema>;