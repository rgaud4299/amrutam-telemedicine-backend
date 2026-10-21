import { Response } from "express";

export interface Pagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

/**
 * Send a successful API response.
 */
export const apiResponseSuccess = (
  data: unknown,
  success: boolean,
  responseCode: number,
  message: string,
  pagination: Pagination | null = null,
  res: Response
): Response => {
  return res.status(responseCode).json({
    data,
    success,
    responseCode,
    message,
    pagination,
  });
};

/**
 * Send an error API response.
 */
export const apiResponseErr = (
  data: unknown,
  success: boolean,
  responseCode: number,
  errMessage: string,
  res: Response
): Response => {
  return res.status(responseCode).json({
    data,
    success,
    responseCode,
    errMessage: errMessage ?? "Something went wrong",
  });
};

export interface SendResponseOptions<T = any> {
  statusCode: number;
  success: boolean;
  message?: string;
  data?: T;
  pagination?: Pagination | null;
}

export const sendResponse = <T>(res: Response, options: SendResponseOptions<T>): Response => {
  let cleanedData: any = options.data !== undefined ? options.data : null;
  if (cleanedData && typeof cleanedData === "object" && !Array.isArray(cleanedData) && "message" in cleanedData) {
    const { message: _msg, ...rest } = cleanedData;
    cleanedData = Object.keys(rest).length > 0 ? rest : null;
  }

  return res.status(options.statusCode).json({
    success: options.success,
    statusCode: options.statusCode,
    message: options.message || "",
    data: cleanedData,
    pagination: options.pagination || null,
  });
};
