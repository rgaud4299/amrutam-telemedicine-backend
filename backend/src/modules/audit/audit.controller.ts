import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/response";
import * as auditService from "./audit.service";

export const getAuditLogs = catchAsync(async (req: Request, res: Response) => {
  const { userId, entity, action, page, limit } = req.query;
  const result = await auditService.getAuditLogs({
    userId: userId as string,
    entity: entity as string,
    action: action as string,
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 20,
  });

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Audit logs fetched",
    data: result,
  });
});
