import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const correlationId = (req.headers["x-request-id"] as string) || (req.headers["x-correlation-id"] as string) || randomUUID();
  (req as any).requestId = correlationId;
  res.setHeader("X-Request-Id", correlationId);

  const startHrTime = process.hrtime();

  res.on("finish", () => {
    const elapsedHrTime = process.hrtime(startHrTime);
    const elapsedTimeInMs = (elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6).toFixed(2);
    if (process.env.NODE_ENV !== "test") {
      console.log(`[${new Date().toISOString()}] [${correlationId}] ${req.method} ${req.originalUrl || req.url} ${res.statusCode} - ${elapsedTimeInMs}ms`);
    }
  });

  next();
};
