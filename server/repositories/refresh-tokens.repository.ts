import { query } from "../db/client.js";

export interface RefreshTokenRow {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  revoked_at: string | null;
}

export async function createRefreshToken(input: {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  userAgent?: string;
  ipAddress?: string;
}): Promise<void> {
  await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip_address)
     VALUES ($1, $2, $3, $4, $5)`,
    [input.userId, input.tokenHash, input.expiresAt, input.userAgent ?? null, input.ipAddress ?? null]
  );
}

export async function findActiveRefreshToken(tokenHash: string): Promise<RefreshTokenRow | null> {
  const result = await query<RefreshTokenRow>(
    `SELECT id, user_id, token_hash, expires_at, revoked_at FROM refresh_tokens
     WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > now()`,
    [tokenHash]
  );
  return result.rows[0] ?? null;
}

export async function revokeRefreshToken(tokenHash: string): Promise<void> {
  await query(`UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = $1`, [tokenHash]);
}

export async function revokeAllRefreshTokensForUser(userId: string): Promise<void> {
  await query(`UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL`, [userId]);
}
