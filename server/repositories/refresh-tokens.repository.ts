import { supabase, unwrap } from "../db/supabase-client.js";

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
  unwrap(
    await supabase.from("refresh_tokens").insert({
      user_id: input.userId,
      token_hash: input.tokenHash,
      expires_at: input.expiresAt.toISOString(),
      user_agent: input.userAgent ?? null,
      ip_address: input.ipAddress ?? null,
    })
  );
}

export async function findActiveRefreshToken(tokenHash: string): Promise<RefreshTokenRow | null> {
  const rows = unwrap(
    await supabase
      .from("refresh_tokens")
      .select("id, user_id, token_hash, expires_at, revoked_at")
      .eq("token_hash", tokenHash)
      .is("revoked_at", null)
      .gt("expires_at", new Date().toISOString())
  );
  return rows[0] ?? null;
}

export async function revokeRefreshToken(tokenHash: string): Promise<void> {
  unwrap(
    await supabase.from("refresh_tokens").update({ revoked_at: new Date().toISOString() }).eq("token_hash", tokenHash)
  );
}

export async function revokeAllRefreshTokensForUser(userId: string): Promise<void> {
  unwrap(
    await supabase
      .from("refresh_tokens")
      .update({ revoked_at: new Date().toISOString() })
      .eq("user_id", userId)
      .is("revoked_at", null)
  );
}
