import { supabase, unwrap, unwrapCount } from "../db/supabase-client.js";

export interface ConversationRow {
  id: string;
  user_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface MessageRow {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "tool" | "system";
  content: string;
  tool_calls: unknown | null;
  tool_call_id: string | null;
  tool_name: string | null;
  created_at: string;
}

export async function createConversation(userId: string, title?: string): Promise<ConversationRow> {
  const rows = unwrap(
    await supabase.from("ai_conversations").insert({ user_id: userId, title: title ?? null }).select("*")
  ) as unknown as ConversationRow[];
  return rows[0];
}

export async function findConversation(conversationId: string, userId: string): Promise<ConversationRow | null> {
  const rows = unwrap(
    await supabase.from("ai_conversations").select("*").eq("id", conversationId).eq("user_id", userId)
  ) as unknown as ConversationRow[];
  return rows[0] ?? null;
}

export async function listConversations(userId: string, limit = 30): Promise<ConversationRow[]> {
  return unwrap(
    await supabase
      .from("ai_conversations")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(limit)
  ) as unknown as ConversationRow[];
}

export async function touchConversation(conversationId: string, title?: string): Promise<void> {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (title) patch.title = title;
  unwrap(await supabase.from("ai_conversations").update(patch).eq("id", conversationId));
}

export async function addMessage(input: {
  conversationId: string;
  role: MessageRow["role"];
  content: string;
  toolCalls?: unknown;
  toolCallId?: string;
  toolName?: string;
}): Promise<MessageRow> {
  const rows = unwrap(
    await supabase
      .from("ai_messages")
      .insert({
        conversation_id: input.conversationId,
        role: input.role,
        content: input.content,
        tool_calls: input.toolCalls ?? null,
        tool_call_id: input.toolCallId ?? null,
        tool_name: input.toolName ?? null,
      })
      .select("*")
  ) as unknown as MessageRow[];
  return rows[0];
}

export async function listMessages(conversationId: string, limit = 40): Promise<MessageRow[]> {
  const rows = unwrap(
    await supabase
      .from("ai_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(limit)
  ) as unknown as MessageRow[];
  return rows.reverse();
}

export async function countUserMessages(conversationId: string): Promise<number> {
  return unwrapCount(
    await supabase
      .from("ai_messages")
      .select("*", { count: "exact", head: true })
      .eq("conversation_id", conversationId)
      .eq("role", "user")
  );
}
