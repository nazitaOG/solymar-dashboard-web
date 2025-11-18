// src/lib/schemas/plane/plane.schema.ts

import { z } from "zod";
import { Currency } from "@/lib/interfaces/currency/currency.interface";

import { planeBaseSchema } from "./plane-base.schema";
import { planeSegmentListSchema } from "./plane-segment.schema";

const currencyValues = Object.values(Currency) as [Currency, ...Currency[]];

export const createPlaneSchema = planeBaseSchema.extend({
  currency: z.enum(currencyValues),
  reservationId: z.string().uuid("ReservationId inválido"),
  segments: planeSegmentListSchema,
});

export type PlaneCreateSchema = z.infer<typeof createPlaneSchema>;

export const updatePlaneSchema = planeBaseSchema
  .partial()
  .extend({
    segments: planeSegmentListSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debes modificar al menos un campo",
  });

export type PlaneUpdateSchema = z.infer<typeof updatePlaneSchema>;
