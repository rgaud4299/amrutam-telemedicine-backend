import { z } from "zod";

export const createPrescriptionSchema = z.object({
  consultationId: z.string().min(1, "Consultation ID is required"),
  patientId: z.string().min(1, "Patient ID is required"),
  diagnosis: z.string().trim().optional(),
  medications: z.any().optional(),
  instructions: z.string().trim().optional(),
  digitalSignature: z.string().trim().optional(),
});
