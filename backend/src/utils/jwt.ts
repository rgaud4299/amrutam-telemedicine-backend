import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!;

if (!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET) {
  throw new Error(
    "JWT secrets must be set: ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET"
  );
}

export interface TokenPayload extends JwtPayload {
  id: string;
  role: string;
  tokenVersion?: number;
}

/**
 * Generate Access Token (15 minutes)
 */
export const generateAccessToken = (userId: string, role: string, tokenVersion = 0): string => {
  return jwt.sign(
    {
      id: userId,
      role,
      tokenVersion,
    },
    ACCESS_TOKEN_SECRET,
    {
      expiresIn: "150m",
    }
  );
};

/**
 * Generate Refresh Token (30 days)
 */
export const generateRefreshToken = (userId: string, role: string, tokenVersion = 0): string => {
  return jwt.sign(
    {
      id: userId,
      role,
      tokenVersion,
    },
    REFRESH_TOKEN_SECRET,
    {
      expiresIn: "30d",
    }
  );
};

/**
 * Verify Token
 */
export const verifyToken = (token: string, type: "access" | "refresh"): TokenPayload => {
  const secret = type === "access" ? ACCESS_TOKEN_SECRET : REFRESH_TOKEN_SECRET;
  return jwt.verify(token, secret) as TokenPayload;
};