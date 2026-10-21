import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { apiResponseErr } from "../utils/response";
import { statusCode } from "../utils/constants";

export const validate = (schema: ZodSchema, target: "body" | "query" | "params" = "body") => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (target === "query") {
        const parsed = schema.parse(req.query);
        Object.defineProperty(req, 'query', { value: parsed, writable: true });
      } else if (target === "params") {
        req.params = schema.parse(req.params) as any;
      } else {
        req.body = schema.parse(req.body);
      }
      next();
    } catch (error: any) {
      if (error instanceof ZodError) {
        const firstIssue = error.issues?.[0];
        const fieldName = firstIssue?.path?.join(".") || "Field";
        const message = firstIssue?.message ? `${fieldName}: ${firstIssue.message}` : "Validation error";
        return apiResponseErr(null, false, statusCode.badRequest, message, res);
      }

      return apiResponseErr(
        null,
        false,
        statusCode.badRequest,
        error?.message || "Validation error",
        res,
      );
    }
  };
};
