import { Request, Response, NextFunction } from "express";
import { apiResponseErr } from "../utils/response";
import { AppError } from "../utils/appError";
import { statusCode } from "../utils/constants";

export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    return apiResponseErr(null, false, err.statusCode, err.message, res);
  }
  console.error(err);
  return apiResponseErr(null, false, statusCode.internalServerError, "Internal Server Error", res);
};