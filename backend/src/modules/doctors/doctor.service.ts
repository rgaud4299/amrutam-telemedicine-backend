import prisma from "../../config/prisma";
import { AppError } from "../../utils/appError";

interface DoctorFilter {
  specialization?: string;
  page?: number;
  limit?: number;
}

export const getDoctors = async (filter: DoctorFilter) => {
  const page = filter.page && filter.page > 0 ? filter.page : 1;
  const limit = filter.limit && filter.limit > 0 ? filter.limit : 10;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (filter.specialization) {
    where.specialization = { contains: filter.specialization, mode: "insensitive" };
  }

  const [doctors, total] = await Promise.all([
    prisma.doctor.findMany({
      where,
      skip,
      take: limit,
      include: {
        user: {
          include: { profile: true },
        },
      },
      orderBy: { rating: "desc" },
    }),
    prisma.doctor.count({ where }),
  ]);

  const list = doctors.map((d) => ({
    id: d.id,
    userId: d.userId,
    specialization: d.specialization,
    qualifications: d.qualifications,
    experienceYears: d.experienceYears,
    feeCents: d.feeCents,
    bio: d.bio,
    rating: d.rating,
    name: d.user.profile
      ? `${d.user.profile.firstName} ${d.user.profile.lastName}`
      : d.user.email,
  }));

  return {
    doctors: list,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getDoctorById = async (id: string) => {
  const doctor = await prisma.doctor.findUnique({
    where: { id },
    include: {
      user: {
        include: { profile: true },
      },
      slots: {
        where: {
          isBooked: false,
          date: { gte: new Date() },
        },
        orderBy: { date: "asc" },
      },
    },
  });

  if (!doctor) {
    throw new AppError(404, "Doctor not found");
  }

  return doctor;
};

export const updateDoctorProfile = async (
  userId: string,
  data: {
    specialization: string;
    qualifications?: string;
    experienceYears?: number;
    feeCents?: number;
    bio?: string;
    licenseNumber?: string;
  },
) => {
  const doctor = await prisma.doctor.upsert({
    where: { userId },
    update: data,
    create: {
      userId,
      ...data,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: "UPDATE_DOCTOR_PROFILE",
      entity: "Doctor",
      entityId: doctor.id,
    },
  });

  return doctor;
};
