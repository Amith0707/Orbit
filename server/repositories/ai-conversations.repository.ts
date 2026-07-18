import { query } from "../db/client.js";

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
  const result = await query<ConversationRow>(
    `INSERT INTO ai_conversations (user_id, title) VALUES ($1, $2) RETURNING *`,
    [userId, title ?? null]
  );
  return result.rows[0];
}

export async function findConversation(conversationId: string, userId: string): Promise<ConversationRow | null> {
  const result = await query<ConversationRow>(
    `SELECT * FROM ai_conversations WHERE id = $1 AND user_id = $2`,
    [conversationId, userId]
  );
  return result.rows[0] ?? null;
}

export async function listConversations(userId: string, limit = 30): Promise<ConversationRow[]> {
  const result = await query<ConversationRow>(
    `SELECT * FROM ai_conversations WHERE user_id = $1 ORDER BY updated_at DESC LIMIT $2`,
    [userId, limit]
  );
  return result.rows;
}

export async function touchConversation(conversationId: string, title?: string): Promise<void> {
  if (title) {
    await query(`UPDATE ai_conversations SET title = $2, updated_at = now() WHERE id = $1`, [conversationId, title]);
  } else {
    await query(`UPDATE ai_conversations SET updated_at = now() WHERE id = $1`, [conversationId]);
  }
}

export async function addMessage(input: {
  conversationId: string;
  role: MessageRow["role"];
  content: string;
  toolCalls?: unknown;
  toolCallId?: string;
  toolName?: string;
}): Promise<MessageRow> {
  const result = await query<MessageRow>(
    `INSERT INTO ai_messages (conversation_id, role, content, tool_calls, tool_call_id, tool_name)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [
      input.conversationId,
      input.role,
      input.content,
      input.toolCalls ? JSON.stringify(input.toolCalls) : null,
      input.toolCallId ?? null,
      input.toolName ?? null,
    ]
  );
  return result.rows[0];
}

export async function listMessages(conversationId: string, limit = 40): Promise<MessageRow[]> {
  const result = await query<MessageRow>(
    `SELECT * FROM (
       SELECT * FROM ai_messages WHERE conversation_id = $1 ORDER BY created_at DESC LIMIT $2
     ) recent ORDER BY created_at ASC`,
    [conversationId, limit]
  );
  return result.rows;
}

export async function countUserMessages(conversationId: string): Promise<number> {
  const result = await query<{ count: string }>(
    `SELECT COUNT(*) FROM ai_messages WHERE conversation_id = $1 AND role = 'user'`,
    [conversationId]
  );
  return Number.parseInt(result.rows[0].count, 10);
}
