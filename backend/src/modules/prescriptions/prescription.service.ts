import prisma from "../../config/prisma";
import { AppError } from "../../utils/appError";

export const createPrescription = async (
  doctorId: string,
  data: {
    consultationId: string;
    patientId: string;
    diagnosis?: string;
    medications?: any;
    instructions?: string;
    digitalSignature?: string;
  },
) => {
  const consultation = await prisma.consultation.findUnique({
    where: { id: data.consultationId },
  });

  if (!consultation) {
    throw new AppError(404, "Consultation not found");
  }

  if (consultation.doctorId !== doctorId) {
    throw new AppError(403, "You are not the doctor for this consultation");
  }

  const existing = await prisma.prescription.findUnique({
    where: { consultationId: data.consultationId },
  });

  if (existing) {
    throw new AppError(409, "Prescription already exists for this consultation");
  }

  const prescription = await prisma.prescription.create({
    data: {
      consultationId: data.consultationId,
      doctorId,
      patientId: data.patientId,
      diagnosis: data.diagnosis,
      medications: data.medications,
      instructions: data.instructions,
      digitalSignature: data.digitalSignature,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: doctorId,
      action: "CREATE_PRESCRIPTION",
      entity: "Prescription",
      entityId: prescription.id,
    },
  });

  return prescription;
};

export const getPrescriptionByConsultationId = async (
  userId: string,
  consultationId: string,
) => {
  const prescription = await prisma.prescription.findUnique({
    where: { consultationId },
  });

  if (!prescription) {
    throw new AppError(404, "Prescription not found");
  }

  if (prescription.doctorId !== userId && prescription.patientId !== userId) {
    throw new AppError(403, "Access denied");
  }

  return prescription;
};

export const getMyPrescriptions = async (userId: string, role: string) => {
  const where = role === "DOCTOR" ? { doctorId: userId } : { patientId: userId };

  return prisma.prescription.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      consultation: {
        include: { slot: true },
      },
    },
  });
};
