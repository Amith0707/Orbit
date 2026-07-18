import { randomBytes, createHash } from "node:crypto";
import {
  createUser,
  findUserByEmail,
  findUserById,
  touchLastLogin,
  type UserRow,
} from "../repositories/users.repository.js";
import {
  createRefreshToken,
  findActiveRefreshToken,
  revokeAllRefreshTokensForUser,
  revokeRefreshToken,
} from "../repositories/refresh-tokens.repository.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { signAccessToken } from "../utils/jwt.js";
import { AppError } from "../utils/app-error.js";

const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function toPublicUser(user: UserRow) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    avatarUrl: user.avatar_url,
    role: user.role,
    departmentId: user.department_id,
    jobTitle: user.job_title,
    bio: user.bio,
    location: user.location,
    availability: user.availability,
    hireDate: user.hire_date,
    createdAt: user.created_at,
  };
}

interface AuthResult {
  user: ReturnType<typeof toPublicUser>;
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

async function issueTokens(user: UserRow, meta: { userAgent?: string; ipAddress?: string }): Promise<AuthResult> {
  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const rawRefreshToken = randomBytes(64).toString("hex");
  const refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

  await createRefreshToken({
    userId: user.id,
    tokenHash: hashToken(rawRefreshToken),
    expiresAt: refreshTokenExpiresAt,
    userAgent: meta.userAgent,
    ipAddress: meta.ipAddress,
  });

  return {
    user: toPublicUser(user),
    accessToken,
    refreshToken: rawRefreshToken,
    refreshTokenExpiresAt,
  };
}

export async function register(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  meta: { userAgent?: string; ipAddress?: string };
}): Promise<AuthResult> {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw AppError.conflict("An account with this email already exists");
  }

  const passwordHash = await hashPassword(input.password);
  // Role is always hardcoded to "employee" here — administrators are only created via the seed script.
  const user = await createUser({
    email: input.email,
    passwordHash,
    firstName: input.firstName,
    lastName: input.lastName,
    role: "employee",
  });

  return issueTokens(user, input.meta);
}

export async function login(input: {
  email: string;
  password: string;
  meta: { userAgent?: string; ipAddress?: string };
}): Promise<AuthResult> {
  const user = await findUserByEmail(input.email);
  if (!user || !user.is_active) {
    throw AppError.unauthorized("Invalid email or password");
  }

  const passwordMatches = await comparePassword(input.password, user.password_hash);
  if (!passwordMatches) {
    throw AppError.unauthorized("Invalid email or password");
  }

  await touchLastLogin(user.id);
  return issueTokens(user, input.meta);
}

export async function refresh(input: {
  rawRefreshToken: string;
  meta: { userAgent?: string; ipAddress?: string };
}): Promise<AuthResult> {
  const tokenHash = hashToken(input.rawRefreshToken);
  const existing = await findActiveRefreshToken(tokenHash);
  if (!existing) {
    throw AppError.unauthorized("Session expired. Please log in again.");
  }

  const user = await findUserById(existing.user_id);
  if (!user || !user.is_active) {
    throw AppError.unauthorized("Session expired. Please log in again.");
  }

  // Rotate: revoke the used token before issuing a new one.
  await revokeRefreshToken(tokenHash);
  return issueTokens(user, input.meta);
}

export async function logout(rawRefreshToken: string | undefined): Promise<void> {
  if (!rawRefreshToken) return;
  await revokeRefreshToken(hashToken(rawRefreshToken));
}

export async function logoutAll(userId: string): Promise<void> {
  await revokeAllRefreshTokensForUser(userId);
}
