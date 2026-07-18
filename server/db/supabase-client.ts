import { createClient } from "@supabase/supabase-js";
import { config } from "../config/env.js";

// Server-only client using the service_role key: bypasses RLS entirely, since
// authorization is enforced by Express middleware (requireAuth/requireRole),
// not by Postgres row-level security. Never expose this key to the browser.
export const supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export class SupabaseQueryError extends Error {
  constructor(
    message: string,
    public readonly cause: { code?: string; details?: string | null; hint?: string | null }
  ) {
    super(message);
    this.name = "SupabaseQueryError";
  }
}

/** Throws on any Postgres/PostgREST error so repositories don't have to check `error` manually. */
export function unwrap<T>({ data, error }: { data: T | null; error: { message: string; code?: string; details?: string | null; hint?: string | null } | null }): T {
  if (error) {
    throw new SupabaseQueryError(error.message, error);
  }
  return data as T;
}

/** Like `unwrap`, but for `{ count: "exact", head: true }` queries where the row count is a sibling of `data`, not part of it. */
export function unwrapCount(result: {
  error: { message: string; code?: string; details?: string | null; hint?: string | null } | null;
  count: number | null;
}): number {
  if (result.error) {
    throw new SupabaseQueryError(result.error.message, result.error);
  }
  return result.count ?? 0;
}

/** Like `unwrap`, but for `{ count: "exact" }` (non-head) queries that return both rows and a total count together. */
export function unwrapWithCount<T>(result: {
  data: T | null;
  error: { message: string; code?: string; details?: string | null; hint?: string | null } | null;
  count: number | null;
}): { rows: T; count: number } {
  if (result.error) {
    throw new SupabaseQueryError(result.error.message, result.error);
  }
  return { rows: result.data as T, count: result.count ?? 0 };
}
