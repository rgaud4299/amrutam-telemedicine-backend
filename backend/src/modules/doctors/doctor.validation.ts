import { z } from "zod";

export const doctorQuerySchema = z.object({
  specialization: z.string().trim().optional(),
  page: z.string().regex(/^\d+$/).optional().default("1"),
  limit: z.string().regex(/^\d+$/).optional().default("10"),
});

export const updateDoctorProfileSchema = z.object({
  specialization: z.string().trim().min(2, "Specialization is required"),
  qualifications: z.string().trim().optional(),
  experienceYears: z.number().int().min(0).optional(),
  feeCents: z.number().int().min(0).optional(),
  bio: z.string().trim().optional(),
  licenseNumber: z.string().trim().optional(),
});
