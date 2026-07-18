import type { Request, Response } from "express";
import { z } from "zod";
import * as authService from "../services/auth.service.js";
import { setRefreshCookie, clearRefreshCookie, REFRESH_COOKIE_NAME } from "../utils/cookies.js";
import { findUserById } from "../repositories/users.repository.js";
import { toPublicUser } from "../services/auth.service.js";
import { AppError } from "../utils/app-error.js";

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

function requestMeta(req: Request) {
  return {
    userAgent: req.headers["user-agent"],
    ipAddress: req.ip,
  };
}

function respondWithAuth(res: Response, result: Awaited<ReturnType<typeof authService.register>>) {
  setRefreshCookie(res, result.refreshToken, result.refreshTokenExpiresAt);
  res.json({ user: result.user, accessToken: result.accessToken });
}

export async function handleRegister(req: Request, res: Response) {
  const input = registerSchema.parse(req.body);
  const result = await authService.register({ ...input, meta: requestMeta(req) });
  respondWithAuth(res, result);
}

export async function handleLogin(req: Request, res: Response) {
  const input = loginSchema.parse(req.body);
  const result = await authService.login({ ...input, meta: requestMeta(req) });
  respondWithAuth(res, result);
}

export async function handleRefresh(req: Request, res: Response) {
  const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!rawRefreshToken) {
    throw AppError.unauthorized("No active session");
  }
  const result = await authService.refresh({ rawRefreshToken, meta: requestMeta(req) });
  respondWithAuth(res, result);
}

export async function handleLogout(req: Request, res: Response) {
  const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
  await authService.logout(rawRefreshToken);
  clearRefreshCookie(res);
  res.json({ success: true });
}

export async function handleLogoutAll(req: Request, res: Response) {
  await authService.logoutAll(req.user!.id);
  clearRefreshCookie(res);
  res.json({ success: true });
}

export async function handleMe(req: Request, res: Response) {
  const user = await findUserById(req.user!.id);
  if (!user) throw AppError.unauthorized();
  res.json({ user: toPublicUser(user) });
}
