import prisma from "../../config/prisma";
import { AppError } from "../../utils/appError";

export const bookConsultation = async (
  patientId: string,
  data: { doctorId: string; slotId: string },
) => {
  return prisma.$transaction(async (tx) => {
    const slot = await tx.availabilitySlot.findUnique({ where: { id: data.slotId } });
    if (!slot) {
      throw new AppError(404, "Slot not found");
    }
    if (slot.isBooked) {
      throw new AppError(409, "Slot is already booked");
    }

    const doctor = await tx.doctor.findUnique({ where: { id: slot.doctorId } });
    if (!doctor || doctor.id !== data.doctorId) {
      throw new AppError(400, "Slot does not belong to this doctor");
    }

    await tx.availabilitySlot.update({
      where: { id: data.slotId },
      data: { isBooked: true },
    });

    const consultation = await tx.consultation.create({
      data: {
        patientId,
        doctorId: doctor.userId,
        slotId: data.slotId,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: patientId,
        action: "BOOK_CONSULTATION",
        entity: "Consultation",
        entityId: consultation.id,
      },
    });

    return consultation;
  });
};

export const getMyConsultations = async (
  userId: string,
  role: string,
  query: { status?: string; page?: number; limit?: number },
) => {
  const page = query.page && query.page > 0 ? query.page : 1;
  const limit = query.limit && query.limit > 0 ? query.limit : 10;
  const skip = (page - 1) * limit;

  const where: any = role === "DOCTOR" ? { doctorId: userId } : { patientId: userId };
  if (query.status) {
    where.status = query.status;
  }

  const [consultations, total] = await Promise.all([
    prisma.consultation.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        slot: true,
        prescription: true,
        payment: true,
      },
    }),
    prisma.consultation.count({ where }),
  ]);

  return {
    consultations,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getConsultationById = async (userId: string, consultationId: string) => {
  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId },
    include: {
      slot: true,
      prescription: true,
      payment: true,
    },
  });

  if (!consultation) {
    throw new AppError(404, "Consultation not found");
  }

  if (consultation.patientId !== userId && consultation.doctorId !== userId) {
    throw new AppError(403, "Access denied");
  }

  return consultation;
};

export const updateStatus = async (
  consultationId: string,
  data: { status: "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"; meetingLink?: string },
) => {
  return prisma.consultation.update({
    where: { id: consultationId },
    data: {
      status: data.status,
      ...(data.meetingLink && { meetingLink: data.meetingLink }),
    },
  });
};

export const cancelConsultation = async (userId: string, consultationId: string) => {
  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId },
  });

  if (!consultation) {
    throw new AppError(404, "Consultation not found");
  }

  if (consultation.patientId !== userId && consultation.doctorId !== userId) {
    throw new AppError(403, "Access denied");
  }

  if (consultation.status === "COMPLETED" || consultation.status === "CANCELLED") {
    throw new AppError(400, "Cannot cancel a completed or already cancelled consultation");
  }

  await prisma.$transaction([
    prisma.consultation.update({
      where: { id: consultation.id },
      data: { status: "CANCELLED" },
    }),
    prisma.availabilitySlot.update({
      where: { id: consultation.slotId },
      data: { isBooked: false },
    }),
  ]);

  return null;
};
