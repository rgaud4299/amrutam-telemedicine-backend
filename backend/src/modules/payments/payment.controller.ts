import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/response";
import * as paymentService from "./payment.service";

export const processPayment = catchAsync(async (req: Request, res: Response) => {
  const patientId = (req.user?.id || req.userId)!;
  const payment = await paymentService.processPayment(patientId, req.body);

  return sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Payment processed",
    data: payment,
  });
});

export const getMyPayments = catchAsync(async (req: Request, res: Response) => {
  const patientId = (req.user?.id || req.userId)!;
  const payments = await paymentService.getMyPayments(patientId);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Payments fetched",
    data: payments,
  });
});

export const getPaymentById = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user?.id || req.userId)!;
  const payment = await paymentService.getPaymentById(userId, req.params.id as string);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Payment details",
    data: payment,
  });
});
