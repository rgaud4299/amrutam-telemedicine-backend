import { z } from "zod";

export const bookConsultationSchema = z.object({
  doctorId: z.string().min(1, "Doctor ID is required"),
  slotId: z.string().min(1, "Slot ID is required"),
});

export const updateConsultationStatusSchema = z.object({
  status: z.enum(["CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
  meetingLink: z.string().url().optional(),
});
