import prisma from "../../config/prisma";
import bcrypt from "bcryptjs";
import { authenticator } from "otplib";
import { AppError } from "../../utils/appError";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../../utils/token";

const SALT_ROUNDS = 12;

export const register = async (body: {
  email: string;
  phone?: string;
  password: string;
  role: "PATIENT" | "DOCTOR";
  firstName: string;
  lastName: string;
}) => {
  const { email, phone, password, role, firstName, lastName } = body;
  const emailLower = email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email: emailLower } });
  if (existing) {
    throw new AppError(409, "An account with this email already exists");
  }

  if (phone) {
    const phoneExists = await prisma.user.findUnique({ where: { phone } });
    if (phoneExists) {
      throw new AppError(409, "An account with this phone number already exists");
    }
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: emailLower,
      phone: phone || null,
      passwordHash,
      role,
      profile: {
        create: { firstName, lastName },
      },
    },
    include: { profile: true },
  });

  const accessToken = generateAccessToken(user.id, user.role, 0);
  const refreshToken = generateRefreshToken(user.id, user.role, 0);

  await prisma.auditLog.create({
    data: { userId: user.id, action: "REGISTER", entity: "User", entityId: user.id },
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName,
      lastName,
    },
  };
};

export const login = async (body: { email: string; password: string }) => {
  const { email, password } = body;
  const emailLower = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email: emailLower },
    include: { profile: true },
  });

  if (!user) {
    throw new AppError(401, "Invalid email or password");
  }

  if (user.status !== "ACTIVE") {
    throw new AppError(403, "Account is suspended. Contact support.");
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new AppError(401, "Invalid email or password");
  }

  const accessToken = generateAccessToken(user.id, user.role, 0);
  const refreshToken = generateRefreshToken(user.id, user.role, 0);

  await prisma.auditLog.create({
    data: { userId: user.id, action: "LOGIN", entity: "User", entityId: user.id },
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      firstName: user.profile?.firstName ?? null,
      lastName: user.profile?.lastName ?? null,
    },
  };
};

export const refreshTokenPair = async (token: string) => {
  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new AppError(401, "Invalid or expired refresh token");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.id } });
  if (!user || user.status !== "ACTIVE") {
    throw new AppError(401, "Account not found or suspended");
  }

  return {
    accessToken: generateAccessToken(user.id, user.role, 0),
    refreshToken: generateRefreshToken(user.id, user.role, 0),
  };
};

export const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true, doctorInfo: true },
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    profile: user.profile
      ? {
          firstName: user.profile.firstName,
          lastName: user.profile.lastName,
          gender: user.profile.gender,
          dob: user.profile.dob,
          bloodGroup: user.profile.bloodGroup,
          address: user.profile.address,
        }
      : null,
    doctorInfo: user.doctorInfo
      ? {
          specialization: user.doctorInfo.specialization,
          qualifications: user.doctorInfo.qualifications,
          experienceYears: user.doctorInfo.experienceYears,
          bio: user.doctorInfo.bio,
          rating: user.doctorInfo.rating,
        }
      : null,
  };
};

export const setupMfa = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, "User not found");

  const secret = authenticator.generateSecret();
  const otpauth = authenticator.keyuri(user.email, "Amrutam Telemedicine", secret);

  return {
    secret,
    otpauth,
  };
};

export const verifyAndEnableMfa = async (userId: string, token: string, secret: string) => {
  const isValid = authenticator.verify({ token, secret });
  if (!isValid) throw new AppError(400, "Invalid MFA code");

  await prisma.user.update({
    where: { id: userId },
    data: { isMfaEnabled: true },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: "ENABLE_MFA",
      entity: "User",
      entityId: userId,
    },
  });

  return { success: true, message: "MFA enabled successfully" };
};
