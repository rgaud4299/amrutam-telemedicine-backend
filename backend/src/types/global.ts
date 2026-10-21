declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
      adminId?: string;
      adminRole?: string;
      user?: {
        id: string;
        role?: string;
        [key: string]: any;
      };
      role?: string;
      rawBody?: Buffer;
      managerId?: string;
    }
  }
}

export {};
