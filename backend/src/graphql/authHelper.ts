import { AppError } from "../utils/appError";
import { MyContext } from "./context";

export function requireAuth(context: MyContext) {
  if (!context.userId) {
    throw new AppError(401, "Unauthorized");
  }
}

export function requireRole(context: MyContext, allowedRoles: string[]) {
  requireAuth(context);
  if (!context.role || !allowedRoles.includes(context.role)) {
    throw new AppError(403, "Access denied. Required roles: " + allowedRoles.join(", "));
  }
}
