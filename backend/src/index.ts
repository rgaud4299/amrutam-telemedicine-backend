import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import prisma from "./config/prisma";
import "./types/global";

import { globalErrorHandler } from "./middlewares/errorHandler";
import { authorize } from "./middlewares/auth.middleware";
import { requestIdMiddleware } from "./middlewares/requestId";
import { metricsCollector, getMetricsSnapshot } from "./utils/metrics";
import { apiRateLimiter } from "./middlewares/rateLimiter";
import { AppError } from "./utils/appError";

import { ApolloServer, HeaderMap } from "@apollo/server";
import { typeDefs, resolvers } from "./graphql/schema";
import { createContext } from "./graphql/context";

import authRouter from "./modules/auth/auth.routes";
import profileRouter from "./modules/profiles/profile.routes";
import doctorRouter from "./modules/doctors/doctor.routes";
import slotRouter from "./modules/slots/slot.routes";
import consultationRouter from "./modules/consultations/consultation.routes";
import prescriptionRouter from "./modules/prescriptions/prescription.routes";
import paymentRouter from "./modules/payments/payment.routes";
import auditRouter from "./modules/audit/audit.routes";
import analyticsRouter from "./modules/analytics/analytics.routes";

const app = express();
const server = http.createServer(app);

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use(
  express.json({
    limit: "10mb",
    verify: (req, _res, buf) => {
      (req as any).rawBody = buf;
    },
  }),
);
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(requestIdMiddleware);
app.use(metricsCollector);
app.use(apiRateLimiter);

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "UP", message: "Amrutam Telemedicine Backend is running" });
});

app.get("/metrics", (_req: Request, res: Response) => {
  res.status(200).json(getMetricsSnapshot());
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/profiles", profileRouter);
app.use("/api/v1/doctors", doctorRouter);
app.use("/api/v1/slots", slotRouter);
app.use("/api/v1/consultations", consultationRouter);
app.use("/api/v1/prescriptions", prescriptionRouter);
app.use("/api/v1/payments", paymentRouter);
app.use("/api/v1/audit-logs", auditRouter);
app.use("/api/v1/analytics", analyticsRouter);

app.use(globalErrorHandler);

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[Error]", err);
  const status = err.statusCode || 500;
  res.status(status).json({ success: false, message: err.message || "Internal server error" });
});

const PORT = Number(process.env.PORT || 9000);

async function bootstrap() {
  try {
    try {
      await prisma.$connect();
      console.log("Database connected");
    } catch (dbErr: any) {
      console.warn("Database connection notice (check DATABASE_URL in .env):", dbErr.message || dbErr);
    }

    const apolloServer = new ApolloServer({
      typeDefs,
      resolvers,
      formatError: (formattedError, error) => {
        const originalError = (error as any)?.originalError || error;
        if (originalError instanceof AppError) {
          return {
            message: originalError.message,
            locations: formattedError.locations,
            path: formattedError.path,
            extensions: {
              code: originalError.statusCode === 401 ? "UNAUTHORIZED" : "BAD_REQUEST",
              responseCode: originalError.statusCode,
            },
          };
        }
        return formattedError;
      },
    });

    await apolloServer.start();

    app.use("/graphql", authorize({ optional: false }), async (req: Request, res: Response) => {
      const headers = new HeaderMap();
      for (const [key, value] of Object.entries(req.headers)) {
        if (typeof value === "string") headers.set(key, value);
        else if (Array.isArray(value)) headers.set(key, value.join(", "));
      }

      const httpGraphQLResponse = await apolloServer.executeHTTPGraphQLRequest({
        httpGraphQLRequest: {
          method: req.method.toUpperCase(),
          headers,
          body: req.body,
          search: new URL(req.url, `http://${req.headers.host}`).search,
        },
        context: () => createContext({ req }),
      });

      for (const [key, value] of httpGraphQLResponse.headers) {
        res.setHeader(key, value);
      }

      res.statusCode = httpGraphQLResponse.status || 200;

      if (httpGraphQLResponse.body.kind === "complete") {
        res.send(httpGraphQLResponse.body.string);
      } else {
        for await (const chunk of httpGraphQLResponse.body.asyncIterator) {
          res.write(chunk);
        }
        res.end();
      }
    });

    server.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
      console.log(`GraphQL ready at http://localhost:${PORT}/graphql`);
    });
  } catch (error) {
    console.error("Failed to start application:", error);
    process.exit(1);
  }
}

bootstrap();
