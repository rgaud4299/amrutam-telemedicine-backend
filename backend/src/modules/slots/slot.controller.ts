import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/response";
import * as slotService from "./slot.service";

export const getDoctorSlots = catchAsync(async (req: Request, res: Response) => {
  const doctorId = req.params.doctorId as string;
  const { date } = req.query;
  const slots = await slotService.getDoctorSlots(doctorId, date as string);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Slots fetched",
    data: slots,
  });
});

export const createSlot = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user?.id || req.userId)!;
  const slot = await slotService.createSlot(userId, req.body);

  return sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Slot created",
    data: slot,
  });
});

export const createBulkSlots = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user?.id || req.userId)!;
  const result = await slotService.createBulkSlots(userId, req.body.slots);

  return sendResponse(res, {
    statusCode: 201,
    success: true,
    message: `${result.count} slots created`,
    data: result,
  });
});

export const deleteSlot = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user?.id || req.userId)!;
  await slotService.deleteSlot(userId, req.params.slotId as string);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Slot deleted",
    data: null,
  });
});
