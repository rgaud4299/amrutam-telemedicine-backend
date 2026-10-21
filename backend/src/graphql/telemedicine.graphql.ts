import prisma from "../config/prisma";
import { AppError } from "../utils/appError";

const gql = (s: TemplateStringsArray, ...v: any[]) => String.raw({ raw: s }, ...v);

export const telemedicineTypeDefs = gql`
  type UserProfile {
    id: ID!
    email: String!
    phone: String
    role: String!
    status: String!
    createdAt: String
    profile: Profile
    doctorInfo: DoctorInfo
  }

  type Profile {
    firstName: String!
    lastName: String!
    gender: String
    dob: String
    bloodGroup: String
    address: String
  }

  type DoctorInfo {
    id: ID!
    specialization: String!
    qualifications: String
    experienceYears: Int
    feeCents: Int
    bio: String
    rating: Float
  }

  type DoctorListItem {
    id: ID!
    userId: String!
    specialization: String!
    qualifications: String
    experienceYears: Int
    feeCents: Int
    bio: String
    rating: Float
    name: String!
  }

  type DoctorListResult {
    doctors: [DoctorListItem!]!
    total: Int!
  }

  type Slot {
    id: ID!
    doctorId: String!
    date: String!
    startTime: String!
    endTime: String!
    isBooked: Boolean!
  }

  type ConsultationItem {
    id: ID!
    patientId: String!
    doctorId: String!
    slotId: String!
    status: String!
    meetingLink: String
    createdAt: String
    slot: Slot
  }

  type PrescriptionItem {
    id: ID!
    consultationId: String!
    doctorId: String!
    patientId: String!
    diagnosis: String
    medications: JSON
    instructions: String
    createdAt: String
  }

  type PaymentItem {
    id: ID!
    consultationId: String!
    patientId: String!
    amountCents: Int!
    currency: String!
    status: String!
    createdAt: String
  }

  type AuditLogItem {
    id: ID!
    userId: String
    action: String!
    entity: String!
    entityId: String
    ipAddress: String
    userAgent: String
    metadata: JSON
    timestamp: String!
  }

  type AdminAnalyticsOverview {
    totalUsers: Int!
    totalPatients: Int!
    totalDoctors: Int!
    totalRevenueCents: Int!
    totalSuccessfulPayments: Int!
    totalConsultations: Int!
  }

  type ConsultationsStatusBreakdown {
    pending: Int!
    confirmed: Int!
    inProgress: Int!
    completed: Int!
    cancelled: Int!
  }

  type AdminAnalyticsResult {
    overview: AdminAnalyticsOverview!
    consultationsByStatus: ConsultationsStatusBreakdown!
  }

  extend type Query {
    me: UserProfile
    doctors(specialization: String, page: Int, limit: Int): DoctorListResult!
    doctor(id: ID!): DoctorInfo
    doctorSlots(doctorId: ID!, date: String): [Slot!]!
    myConsultations(status: String, page: Int, limit: Int): [ConsultationItem!]!
    consultation(id: ID!): ConsultationItem
    myPrescriptions: [PrescriptionItem!]!
    myPayments: [PaymentItem!]!
    auditLogs(userId: String, entity: String, action: String, page: Int, limit: Int): [AuditLogItem!]!
    adminAnalytics: AdminAnalyticsResult!
  }
`;

export const telemedicineResolvers = {
  Query: {
    me: async (_: any, __: any, ctx: any) => {
      if (!ctx.userId) throw new AppError(401, "Authentication required");
      const user = await prisma.user.findUnique({
        where: { id: ctx.userId },
        include: { profile: true, doctorInfo: true },
      });
      if (!user) throw new AppError(404, "User not found");
      return {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt.toISOString(),
        profile: user.profile,
        doctorInfo: user.doctorInfo,
      };
    },

    doctors: async (_: any, args: { specialization?: string; page?: number; limit?: number }) => {
      const page = args.page || 1;
      const limit = args.limit || 10;
      const where: any = {};
      if (args.specialization) where.specialization = { contains: args.specialization, mode: "insensitive" };

      const [doctors, total] = await Promise.all([
        prisma.doctor.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          include: { user: { include: { profile: true } } },
          orderBy: { rating: "desc" },
        }),
        prisma.doctor.count({ where }),
      ]);

      return {
        doctors: doctors.map((d: any) => ({
          ...d,
          name: d.user.profile ? `${d.user.profile.firstName} ${d.user.profile.lastName}` : d.user.email,
        })),
        total,
      };
    },

    doctor: async (_: any, args: { id: string }) => {
      const doc = await prisma.doctor.findUnique({ where: { id: args.id } });
      if (!doc) throw new AppError(404, "Doctor not found");
      return doc;
    },

    doctorSlots: async (_: any, args: { doctorId: string; date?: string }) => {
      const where: any = { doctorId: args.doctorId, isBooked: false };
      if (args.date) {
        const d = new Date(args.date);
        where.date = { gte: d, lt: new Date(d.getTime() + 86400000) };
      } else {
        where.date = { gte: new Date() };
      }
      return prisma.availabilitySlot.findMany({ where, orderBy: { startTime: "asc" } });
    },

    myConsultations: async (_: any, args: { status?: string; page?: number; limit?: number }, ctx: any) => {
      if (!ctx.userId) throw new AppError(401, "Authentication required");
      const where: any = ctx.role === "DOCTOR" ? { doctorId: ctx.userId } : { patientId: ctx.userId };
      if (args.status) where.status = args.status;

      return prisma.consultation.findMany({
        where,
        skip: ((args.page || 1) - 1) * (args.limit || 10),
        take: args.limit || 10,
        orderBy: { createdAt: "desc" },
        include: { slot: true },
      });
    },

    consultation: async (_: any, args: { id: string }, ctx: any) => {
      if (!ctx.userId) throw new AppError(401, "Authentication required");
      const c = await prisma.consultation.findUnique({ where: { id: args.id }, include: { slot: true } });
      if (!c) throw new AppError(404, "Consultation not found");
      if (c.patientId !== ctx.userId && c.doctorId !== ctx.userId) throw new AppError(403, "Access denied");
      return c;
    },

    myPrescriptions: async (_: any, __: any, ctx: any) => {
      if (!ctx.userId) throw new AppError(401, "Authentication required");
      const where = ctx.role === "DOCTOR" ? { doctorId: ctx.userId } : { patientId: ctx.userId };
      return prisma.prescription.findMany({ where, orderBy: { createdAt: "desc" } });
    },

    myPayments: async (_: any, __: any, ctx: any) => {
      if (!ctx.userId) throw new AppError(401, "Authentication required");
      return prisma.payment.findMany({ where: { patientId: ctx.userId }, orderBy: { createdAt: "desc" } });
    },

    auditLogs: async (_: any, args: { userId?: string; entity?: string; action?: string; page?: number; limit?: number }, ctx: any) => {
      if (!ctx.userId) throw new AppError(401, "Authentication required");
      if (ctx.role !== "ADMIN") throw new AppError(403, "Admin access required");
      const page = args.page || 1;
      const limit = args.limit || 20;
      const where: any = {};
      if (args.userId) where.userId = args.userId;
      if (args.entity) where.entity = args.entity;
      if (args.action) where.action = args.action;

      const logs = await prisma.auditLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { timestamp: "desc" },
      });

      return logs.map((l: any) => ({
        ...l,
        timestamp: l.timestamp.toISOString(),
      }));
    },

    adminAnalytics: async (_: any, __: any, ctx: any) => {
      if (!ctx.userId) throw new AppError(401, "Authentication required");
      if (ctx.role !== "ADMIN") throw new AppError(403, "Admin access required");

      const [totalUsers, totalPatients, totalDoctors, consultationsByStatus, paymentStats] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: "PATIENT" } }),
        prisma.user.count({ where: { role: "DOCTOR" } }),
        prisma.consultation.groupBy({
          by: ["status"],
          _count: { id: true },
        }),
        prisma.payment.aggregate({
          where: { status: "SUCCESS" },
          _sum: { amountCents: true },
          _count: { id: true },
        }),
      ]);

      const statusMap: Record<string, number> = {};
      for (const item of consultationsByStatus) {
        statusMap[item.status] = item._count.id;
      }

      return {
        overview: {
          totalUsers,
          totalPatients,
          totalDoctors,
          totalRevenueCents: paymentStats._sum.amountCents || 0,
          totalSuccessfulPayments: paymentStats._count.id,
          totalConsultations: Object.values(statusMap).reduce((a, b) => a + b, 0),
        },
        consultationsByStatus: {
          pending: statusMap["PENDING"] || 0,
          confirmed: statusMap["CONFIRMED"] || 0,
          inProgress: statusMap["IN_PROGRESS"] || 0,
          completed: statusMap["COMPLETED"] || 0,
          cancelled: statusMap["CANCELLED"] || 0,
        },
      };
    },
  },
};
