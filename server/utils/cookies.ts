import type { Response } from "express";
import { config } from "../config/env.js";

export const REFRESH_COOKIE_NAME = "orbit_refresh_token";
const REFRESH_COOKIE_PATH = "/api/auth";

export function setRefreshCookie(res: Response, token: string, expiresAt: Date) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: "lax",
    path: REFRESH_COOKIE_PATH,
    expires: expiresAt,
  });
}

export function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: "lax",
    path: REFRESH_COOKIE_PATH,
  });
}
