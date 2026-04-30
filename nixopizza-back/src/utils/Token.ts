import jwt, { JwtPayload } from "jsonwebtoken";
import { Response } from "express";
import dotenv from "dotenv";

dotenv.config();

export const generateToken = (
  userId: string,
  isAdmin: boolean,
  expiresIn: string = process.env.TOKEN_EXPIRES_IN || "7d"
): string => {
  const access_secret = process.env.ACCESS_SECRET || "default_secret_key";

  const token = jwt.sign(
    { userId, isAdmin } as Record<string, unknown>,
    access_secret as jwt.Secret,
    { expiresIn } as jwt.SignOptions
  );

  return token;
};

export const verifyToken = (
  token: string,
  secret: string,
  options?: jwt.VerifyOptions
): string | JwtPayload => {
  try {
    return jwt.verify(token, secret as jwt.Secret, options);
  } catch (error) {
    throw new Error("Invalid token");
  }
};
