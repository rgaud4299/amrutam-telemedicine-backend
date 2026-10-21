import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/response";
import * as prescriptionService from "./prescription.service";

export const createPrescription = catchAsync(async (req: Request, res: Response) => {
  const doctorId = (req.user?.id || req.userId)!;
  const prescription = await prescriptionService.createPrescription(doctorId, req.body);

  return sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Prescription created",
    data: prescription,
  });
});

export const getPrescriptionByConsultationId = catchAsync(
  async (req: Request, res: Response) => {
    const userId = (req.user?.id || req.userId)!;
    const prescription = await prescriptionService.getPrescriptionByConsultationId(
      userId,
      req.params.consultationId as string,
    );

    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Prescription fetched",
      data: prescription,
    });
  },
);

export const getMyPrescriptions = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user?.id || req.userId)!;
  const role = req.role || req.user?.role || "PATIENT";
  const prescriptions = await prescriptionService.getMyPrescriptions(userId, role);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Prescriptions fetched",
    data: prescriptions,
  });
});
