import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/response";
import * as doctorService from "./doctor.service";

export const getDoctors = catchAsync(async (req: Request, res: Response) => {
  const { specialization, page, limit } = req.query;
  const result = await doctorService.getDoctors({
    specialization: specialization as string,
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 10,
  });

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Doctors fetched",
    data: result,
  });
});

export const getDoctorById = catchAsync(async (req: Request, res: Response) => {
  const doctor = await doctorService.getDoctorById(req.params.id as string);
  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Doctor details fetched",
    data: doctor,
  });
});

export const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user?.id || req.userId)!;
  const doctor = await doctorService.updateDoctorProfile(userId, req.body);
  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Doctor profile updated",
    data: doctor,
  });
});
