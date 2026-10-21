import { Request } from "express";
import jwt from "jsonwebtoken";

export interface AuthTokenPayload {
  id: string;
  role: string;
  tokenVersion: number;
}

export const generateAccessToken = (id: string, role: string, tokenVersion: number): string => {
  return jwt.sign({ id, role, tokenVersion }, process.env.ACCESS_TOKEN_SECRET!, { expiresIn: "15m" });
};

export const generateRefreshToken = (id: string, role: string, tokenVersion: number): string => {
  return jwt.sign({ id, role, tokenVersion }, process.env.REFRESH_TOKEN_SECRET!, { expiresIn: "7d" });
};

export const verifyAccessToken = (token: string): AuthTokenPayload => {
  return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as AuthTokenPayload;
};

export const verifyRefreshToken = (token: string): AuthTokenPayload => {
  return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET!) as AuthTokenPayload;
};
