import { z } from "zod";

export const createSlotSchema = z.object({
  date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
});

export const bulkCreateSlotSchema = z.object({
  slots: z
    .array(
      z.object({
        date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
        startTime: z.string().datetime(),
        endTime: z.string().datetime(),
      }),
    )
    .min(1, "At least one slot is required"),
});
