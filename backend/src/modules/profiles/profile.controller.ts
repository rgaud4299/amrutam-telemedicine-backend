import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/response";
import * as profileService from "./profile.service";

export const getProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user?.id || req.userId)!;
  const profile = await profileService.getProfile(userId);
  return sendResponse(res, { statusCode: 200, success: true, message: "Profile fetched", data: profile });
});

export const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user?.id || req.userId)!;
  const profile = await profileService.updateProfile(userId, req.body);
  return sendResponse(res, { statusCode: 200, success: true, message: "Profile updated", data: profile });
});
