import { z } from "zod";
import { aiProvider } from "./openai-provider.js";
import { getToolDefinitions, executeTool } from "./tools/index.js";
import {
  createConversation,
  findConversation,
  listConversations,
  touchConversation,
  addMessage,
  listMessages,
  countUserMessages,
  type MessageRow,
} from "../../repositories/ai-conversations.repository.js";
import { listActiveMemories, addMemories } from "../../repositories/ai-memory.repository.js";
import { AppError } from "../../utils/app-error.js";
import type { ChatMessage, ToolCall } from "./provider.js";

const MAX_TOOL_ROUNDS = 3;
const MEMORY_EXTRACTION_INTERVAL = 6;

const memoryFactsSchema = z.object({
  facts: z
    .array(z.string().min(3).max(140))
    .max(3)
    .describe("Short, durable facts worth remembering about this employee for future conversations"),
});

function deriveTitle(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  return trimmed.length > 60 ? `${trimmed.slice(0, 57)}...` : trimmed;
}

function toProviderMessage(row: MessageRow): ChatMessage {
  return {
    role: row.role,
    content: row.content,
    toolCallId: row.tool_call_id ?? undefined,
    toolCalls: (row.tool_calls as ToolCall[] | null) ?? undefined,
  };
}

function buildSystemPrompt(memories: string[]): string {
  const today = new Date().toISOString().slice(0, 10);
  const memoryBlock =
    memories.length > 0
      ? `Known long-term facts about this employee (from past conversations and activity):\n${memories.map((f) => `- ${f}`).join("\n")}`
      : "You don't have any long-term facts about this employee yet.";

  return [
    "You are the AI Buddy inside Calfus Orbit, an employee community platform. You are a warm, encouraging, and concise workplace companion — not a generic chatbot.",
    "Your job is to help the employee build connections at work: discovering communities, meeting coworkers, finding events, and staying engaged.",
    `Today's date is ${today}.`,
    "You have tools to fetch this employee's live app data (their profile, recommended communities, upcoming events, similar coworkers). ALWAYS call the relevant tool before answering questions about recommendations, events, or people — never invent facts, names, or numbers.",
    "When you reference tool results, be specific (names, dates, shared interests) rather than vague. Keep replies short (2-5 sentences) unless the user asks for detail.",
    memoryBlock,
  ].join("\n\n");
}

export async function listThreads(userId: string) {
  const conversations = await listConversations(userId);
  return conversations.map((c) => ({
    id: c.id,
    title: c.title ?? "New conversation",
    updatedAt: c.updated_at,
    createdAt: c.created_at,
  }));
}

export async function createThread(userId: string) {
  const conversation = await createConversation(userId);
  return { id: conversation.id, title: "New conversation", updatedAt: conversation.updated_at, createdAt: conversation.created_at };
}

export async function getThread(userId: string, conversationId: string) {
  const conversation = await findConversation(conversationId, userId);
  if (!conversation) throw AppError.notFound("Conversation not found");
  const messages = await listMessages(conversationId);
  return {
    id: conversation.id,
    title: conversation.title ?? "New conversation",
    messages: messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ id: m.id, role: m.role, content: m.content, createdAt: m.created_at })),
  };
}

async function maybeExtractMemory(userId: string, conversationId: string) {
  try {
    const userMessageCount = await countUserMessages(conversationId);
    if (userMessageCount === 0 || userMessageCount % MEMORY_EXTRACTION_INTERVAL !== 0) return;

    const recent = await listMessages(conversationId, 20);
    const transcript = recent
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");

    const result = await aiProvider.generateStructured({
      schema: memoryFactsSchema,
      schemaName: "memory_facts",
      system:
        "Extract at most 3 short, durable facts about the employee (preferences, interests, availability, goals) from this conversation. Only include facts that would still be useful weeks from now. Return an empty list if there is nothing durable.",
      prompt: transcript,
      temperature: 0.2,
    });

    await addMemories(userId, result.facts, conversationId);
  } catch (err) {
    console.error("Memory extraction failed:", err);
  }
}

export interface StreamReplyResult {
  conversationId: string;
  assistantMessage: string;
}

export async function streamReply(
  userId: string,
  conversationId: string | undefined,
  userText: string,
  onToken: (delta: string) => void
): Promise<StreamReplyResult> {
  let conversation = conversationId ? await findConversation(conversationId, userId) : null;
  if (conversationId && !conversation) throw AppError.notFound("Conversation not found");
  if (!conversation) conversation = await createConversation(userId);

  await addMessage({ conversationId: conversation.id, role: "user", content: userText });
  if (!conversation.title) {
    await touchConversation(conversation.id, deriveTitle(userText));
  } else {
    await touchConversation(conversation.id);
  }

  const [memories, history] = await Promise.all([
    listActiveMemories(userId),
    listMessages(conversation.id),
  ]);

  const messages: ChatMessage[] = [
    { role: "system", content: buildSystemPrompt(memories.map((m) => m.fact)) },
    ...history.map(toProviderMessage),
  ];

  let finalContent = "";
  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const isLastAllowedRound = round === MAX_TOOL_ROUNDS - 1;
    const result = await aiProvider.streamChat(messages, onToken, { tools: getToolDefinitions() });

    if (result.toolCalls?.length && !isLastAllowedRound) {
      await addMessage({
        conversationId: conversation.id,
        role: "assistant",
        content: result.content,
        toolCalls: result.toolCalls,
      });
      messages.push({ role: "assistant", content: result.content, toolCalls: result.toolCalls });

      for (const toolCall of result.toolCalls) {
        const toolResult = await executeTool(toolCall.name, userId);
        const toolContent = JSON.stringify(toolResult);
        await addMessage({
          conversationId: conversation.id,
          role: "tool",
          content: toolContent,
          toolCallId: toolCall.id,
          toolName: toolCall.name,
        });
        messages.push({ role: "tool", content: toolContent, toolCallId: toolCall.id });
      }
      continue;
    }

    finalContent = result.content || "I'm not sure how to answer that yet — could you rephrase?";
    break;
  }

  await addMessage({ conversationId: conversation.id, role: "assistant", content: finalContent });
  void maybeExtractMemory(userId, conversation.id);

  return { conversationId: conversation.id, assistantMessage: finalContent };
}
