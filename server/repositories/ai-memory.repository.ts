import { query } from "../db/client.js";

export interface AiMemoryRow {
  id: string;
  user_id: string;
  fact: string;
  created_at: string;
}

export async function listActiveMemories(userId: string, limit = 30): Promise<AiMemoryRow[]> {
  const result = await query<AiMemoryRow>(
    `SELECT id, user_id, fact, created_at FROM ai_memory
     WHERE user_id = $1 AND is_active = true
     ORDER BY created_at DESC LIMIT $2`,
    [userId, limit]
  );
  return result.rows;
}

export async function addMemories(userId: string, facts: string[], sourceConversationId?: string): Promise<void> {
  if (facts.length === 0) return;
  const existing = await listActiveMemories(userId, 100);
  const existingLower = new Set(existing.map((m) => m.fact.toLowerCase().trim()));
  const fresh = facts.map((f) => f.trim()).filter((f) => f.length > 0 && !existingLower.has(f.toLowerCase()));
  if (fresh.length === 0) return;

  const values = fresh.map((_, i) => `($1, $${i + 2}, $${fresh.length + 2})`).join(", ");
  await query(
    `INSERT INTO ai_memory (user_id, fact, source_conversation_id) VALUES ${values}`,
    [userId, ...fresh, sourceConversationId ?? null]
  );
}
