import { Request } from "express";

export interface MyContext {
  userId?: string;
  role?: string;
}

export const createContext = async ({ req }: { req: Request }): Promise<MyContext> => {
  return {
    userId: req.userId,
    role: req.role,
  };
};
