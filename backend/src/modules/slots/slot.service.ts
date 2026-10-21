import prisma from "../../config/prisma";
import { AppError } from "../../utils/appError";

export const getDoctorSlots = async (doctorId: string, date?: string) => {
  const where: any = { doctorId, isBooked: false };

  if (date) {
    const d = new Date(date);
    where.date = { gte: d, lt: new Date(d.getTime() + 86400000) };
  } else {
    where.date = { gte: new Date() };
  }

  return prisma.availabilitySlot.findMany({
    where,
    orderBy: { startTime: "asc" },
  });
};

export const createSlot = async (
  userId: string,
  data: { date: string; startTime: string; endTime: string },
) => {
  const doctor = await prisma.doctor.findUnique({ where: { userId } });
  if (!doctor) {
    throw new AppError(404, "Doctor profile not found. Complete your doctor profile first.");
  }

  return prisma.availabilitySlot.create({
    data: {
      doctorId: doctor.id,
      date: new Date(data.date),
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
    },
  });
};

export const createBulkSlots = async (
  userId: string,
  slots: Array<{ date: string; startTime: string; endTime: string }>,
) => {
  const doctor = await prisma.doctor.findUnique({ where: { userId } });
  if (!doctor) {
    throw new AppError(404, "Doctor profile not found");
  }

  const created = await prisma.availabilitySlot.createMany({
    data: slots.map((s) => ({
      doctorId: doctor.id,
      date: new Date(s.date),
      startTime: new Date(s.startTime),
      endTime: new Date(s.endTime),
    })),
  });

  return { count: created.count };
};

export const deleteSlot = async (userId: string, slotId: string) => {
  const doctor = await prisma.doctor.findUnique({ where: { userId } });
  if (!doctor) {
    throw new AppError(404, "Doctor profile not found");
  }

  const slot = await prisma.availabilitySlot.findFirst({
    where: { id: slotId, doctorId: doctor.id },
  });

  if (!slot) {
    throw new AppError(404, "Slot not found");
  }

  if (slot.isBooked) {
    throw new AppError(400, "Cannot delete a booked slot");
  }

  await prisma.availabilitySlot.delete({ where: { id: slot.id } });
  return null;
};
