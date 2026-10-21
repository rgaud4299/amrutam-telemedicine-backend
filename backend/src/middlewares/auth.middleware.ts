import { Request, Response, NextFunction } from "express";
import { verifyToken, TokenPayload } from "../utils/jwt";
import prisma from "../config/prisma";
import { apiResponseErr } from "../utils/response";
import { TokenExpiredError, JsonWebTokenError } from "jsonwebtoken";

interface AuthorizeOptions {
  roles?: string[];
  optional?: boolean;
}

export const authorize = (options: AuthorizeOptions = {}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        if (options.optional) {
          return next();
        }
        return apiResponseErr(null, false, 401, "Unauthorized", res);
      }

      const token = authHeader.split(" ")[1];

      // Verify and decode JWT token
      const decoded = verifyToken(token, "access") as TokenPayload;

      if (!decoded?.id || !decoded?.role) {
        if (options.optional) {
          return next();
        }
        return apiResponseErr(null, false, 401, "Invalid token payload", res);
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user) {
        if (options.optional) {
          return next();
        }
        return apiResponseErr(null, false, 401, "Invalid Credentials", res);
      }

      // Attach user details to the request object
      req.userId = user.id;
      req.role = user.role;
      req.user = { id: user.id, role: user.role };

      // Role check
      if (options.roles?.length) {
        if (!options.roles.includes(user.role)) {
          return apiResponseErr(
            null,
            false,
            403,
            `Access denied. Required roles: ${options.roles.join(", ")}`,
            res
          );
        }
      }

      next();
    } catch (err: any) {
      if (options.optional) {
        return next();
      }
      console.error("[authorize middleware]", err);
      let errMsg = "Unauthorized";
      if (err instanceof TokenExpiredError) {
        errMsg = "Token expired";
      } else if (err instanceof JsonWebTokenError) {
        errMsg = "Invalid token";
      }
      return apiResponseErr(null, false, 401, errMsg, res);
    }
  };
};



