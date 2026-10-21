import prisma from "../../config/prisma";
import { AppError } from "../../utils/appError";

export const getProfile = async (userId: string) => {
  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) throw new AppError(404, "Profile not found");
  return profile;
};

export const updateProfile = async (
  userId: string,
  data: {
    firstName?: string;
    lastName?: string;
    gender?: string;
    dob?: string;
    bloodGroup?: string;
    address?: string;
  },
) => {
  const profile = await prisma.profile.upsert({
    where: { userId },
    update: {
      ...(data.firstName && { firstName: data.firstName }),
      ...(data.lastName && { lastName: data.lastName }),
      ...(data.gender && { gender: data.gender as any }),
      ...(data.dob && { dob: new Date(data.dob) }),
      ...(data.bloodGroup && { bloodGroup: data.bloodGroup as any }),
      ...(data.address !== undefined && { address: data.address }),
    },
    create: {
      userId,
      firstName: data.firstName || "",
      lastName: data.lastName || "",
      gender: (data.gender as any) || undefined,
      dob: data.dob ? new Date(data.dob) : undefined,
      bloodGroup: (data.bloodGroup as any) || undefined,
      address: data.address,
    },
  });

  await prisma.auditLog.create({
    data: { userId, action: "UPDATE_PROFILE", entity: "Profile", entityId: profile.id },
  });

  return profile;
};
