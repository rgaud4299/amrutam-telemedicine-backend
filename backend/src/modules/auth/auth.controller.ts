import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/response";
import * as authService from "./auth.service";

export const register = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.register(req.body);
  return sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Account created successfully",
    data: result,
  });
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.login(req.body);
  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Login successful",
    data: result,
  });
});

export const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const token = req.body.refreshToken || req.headers["x-refresh-token"] || req.cookies?.refreshToken;
  const result = await authService.refreshTokenPair(token);
  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Token refreshed",
    data: result,
  });
});

export const getMe = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user?.id || req.userId)!;
  const result = await authService.getMe(userId);
  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Profile fetched",
    data: result,
  });
});

export const setupMfa = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user?.id || req.userId)!;
  const result = await authService.setupMfa(userId);
  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "MFA setup initialized",
    data: result,
  });
});

export const enableMfa = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user?.id || req.userId)!;
  const { token, secret } = req.body;
  const result = await authService.verifyAndEnableMfa(userId, token, secret);
  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "MFA enabled",
    data: result,
  });
});
