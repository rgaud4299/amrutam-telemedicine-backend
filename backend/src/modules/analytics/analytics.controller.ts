import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/response";
import * as analyticsService from "./analytics.service";

export const getAdminAnalytics = catchAsync(async (_req: Request, res: Response) => {
  const data = await analyticsService.getAdminAnalytics();

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Admin analytics fetched",
    data,
  });
});
