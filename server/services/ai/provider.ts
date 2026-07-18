import type { ZodType } from "zod";

export type ChatRole = "system" | "user" | "assistant" | "tool";

export interface ToolCall {
  id: string;
  name: string;
  arguments: string;
}

export interface ChatMessage {
  role: ChatRole;
  content: string;
  /** Set when role === "tool": which tool call this message is a result for. */
  toolCallId?: string;
  /** Set when role === "assistant" made tool calls instead of (or alongside) a text reply. */
  toolCalls?: ToolCall[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ChatResult {
  content: string;
  toolCalls?: ToolCall[];
}

export interface GenerateStructuredInput<T> {
  system?: string;
  prompt: string;
  schema: ZodType<T>;
  schemaName: string;
  temperature?: number;
}

export interface AIProvider {
  chat(messages: ChatMessage[], opts?: { tools?: ToolDefinition[]; temperature?: number }): Promise<ChatResult>;

  streamChat(
    messages: ChatMessage[],
    onToken: (delta: string) => void,
    opts?: { tools?: ToolDefinition[]; temperature?: number }
  ): Promise<ChatResult>;

  generateStructured<T>(input: GenerateStructuredInput<T>): Promise<T>;
}
