import { z } from "zod";

export const createPaymentSchema = z.object({
  consultationId: z.string().min(1, "Consultation ID is required"),
  amountCents: z.number().int().positive("Amount in cents must be positive"),
  currency: z.string().trim().default("USD").optional(),
});
