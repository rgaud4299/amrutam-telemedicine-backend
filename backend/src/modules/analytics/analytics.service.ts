import prisma from "../../config/prisma";

export const getAdminAnalytics = async () => {
  const [
    totalUsers,
    totalPatients,
    totalDoctors,
    consultationsByStatus,
    paymentStats,
    recentConsultations,
  ] = await Promise.all([
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
    prisma.consultation.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        slot: true,
        patient: { select: { email: true, profile: true } },
        doctor: { select: { email: true, profile: true } },
      },
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
    recentConsultations,
  };
};
