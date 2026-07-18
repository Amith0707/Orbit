import jwt from "jsonwebtoken";
import { config } from "../config/env.js";
import type { Role } from "../types/express.js";

export interface AccessTokenPayload {
  sub: string;
  role: Role;
}

const ACCESS_TOKEN_TTL = "15m";

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: ACCESS_TOKEN_TTL });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, config.jwtSecret) as AccessTokenPayload;
}
