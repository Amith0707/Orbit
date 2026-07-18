import { supabase, unwrap } from "../db/supabase-client.js";

export interface AiMemoryRow {
  id: string;
  user_id: string;
  fact: string;
  created_at: string;
}

export async function listActiveMemories(userId: string, limit = 30): Promise<AiMemoryRow[]> {
  return unwrap(
    await supabase
      .from("ai_memory")
      .select("id, user_id, fact, created_at")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(limit)
  ) as unknown as AiMemoryRow[];
}

export async function addMemories(userId: string, facts: string[], sourceConversationId?: string): Promise<void> {
  if (facts.length === 0) return;
  const existing = await listActiveMemories(userId, 100);
  const existingLower = new Set(existing.map((m) => m.fact.toLowerCase().trim()));
  const fresh = facts.map((f) => f.trim()).filter((f) => f.length > 0 && !existingLower.has(f.toLowerCase()));
  if (fresh.length === 0) return;

  unwrap(
    await supabase
      .from("ai_memory")
      .insert(fresh.map((fact) => ({ user_id: userId, fact, source_conversation_id: sourceConversationId ?? null })))
  );
}
