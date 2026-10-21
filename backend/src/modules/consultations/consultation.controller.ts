import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/response";
import * as consultationService from "./consultation.service";

export const bookConsultation = catchAsync(async (req: Request, res: Response) => {
  const patientId = (req.user?.id || req.userId)!;
  const consultation = await consultationService.bookConsultation(patientId, req.body);

  return sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Consultation booked",
    data: consultation,
  });
});

export const getMyConsultations = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user?.id || req.userId)!;
  const role = req.role || req.user?.role || "PATIENT";
  const { status, page, limit } = req.query;

  const result = await consultationService.getMyConsultations(userId, role, {
    status: status as string,
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 10,
  });

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Consultations fetched",
    data: result,
  });
});

export const getConsultationById = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user?.id || req.userId)!;
  const consultation = await consultationService.getConsultationById(userId, req.params.id as string);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Consultation details",
    data: consultation,
  });
});

export const updateStatus = catchAsync(async (req: Request, res: Response) => {
  const consultation = await consultationService.updateStatus(req.params.id as string, req.body);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Status updated",
    data: consultation,
  });
});

export const cancelConsultation = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user?.id || req.userId)!;
  await consultationService.cancelConsultation(userId, req.params.id as string);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Consultation cancelled",
    data: null,
  });
});
