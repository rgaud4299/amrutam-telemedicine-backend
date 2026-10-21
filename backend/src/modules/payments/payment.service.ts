import { randomUUID } from "crypto";
import prisma from "../../config/prisma";
import { AppError } from "../../utils/appError";

export const processPayment = async (
  patientId: string,
  data: { consultationId: string; amountCents: number; currency?: string },
) => {
  const consultation = await prisma.consultation.findUnique({
    where: { id: data.consultationId },
  });

  if (!consultation) {
    throw new AppError(404, "Consultation not found");
  }

  if (consultation.patientId !== patientId) {
    throw new AppError(403, "You are not the patient for this consultation");
  }

  const existingPayment = await prisma.payment.findUnique({
    where: { consultationId: data.consultationId },
  });

  if (existingPayment) {
    throw new AppError(409, "Payment already exists for this consultation");
  }

  const payment = await prisma.payment.create({
    data: {
      consultationId: data.consultationId,
      patientId,
      amountCents: data.amountCents,
      currency: data.currency || "USD",
      idempotencyKey: randomUUID(),
      status: "SUCCESS",
      transactionId: `txn_${Date.now()}`,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: patientId,
      action: "PAYMENT_SUCCESS",
      entity: "Payment",
      entityId: payment.id,
    },
  });

  return payment;
};

export const getMyPayments = async (patientId: string) => {
  return prisma.payment.findMany({
    where: { patientId },
    orderBy: { createdAt: "desc" },
    include: { consultation: true },
  });
};

export const getPaymentById = async (userId: string, paymentId: string) => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { consultation: true },
  });

  if (!payment) {
    throw new AppError(404, "Payment not found");
  }

  if (payment.patientId !== userId) {
    throw new AppError(403, "Access denied");
  }

  return payment;
};
