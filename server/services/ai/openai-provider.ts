import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import type { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/chat/completions";
import { config, isAiConfigured } from "../../config/env.js";
import { AppError } from "../../utils/app-error.js";
import type { AIProvider, ChatMessage, ChatResult, GenerateStructuredInput, ToolCall, ToolDefinition } from "./provider.js";

function assertConfigured() {
  if (!isAiConfigured()) {
    throw new AppError(503, "AI features are not configured yet. Add an OPENAI_API_KEY to the server .env file.");
  }
}

function toOpenAIMessages(messages: ChatMessage[]): ChatCompletionMessageParam[] {
  return messages.map((m) => {
    if (m.role === "tool") {
      return { role: "tool", content: m.content, tool_call_id: m.toolCallId! } satisfies ChatCompletionMessageParam;
    }
    if (m.role === "assistant" && m.toolCalls?.length) {
      return {
        role: "assistant",
        content: m.content || null,
        tool_calls: m.toolCalls.map((tc) => ({
          id: tc.id,
          type: "function" as const,
          function: { name: tc.name, arguments: tc.arguments },
        })),
      } satisfies ChatCompletionMessageParam;
    }
    return { role: m.role, content: m.content } as ChatCompletionMessageParam;
  });
}

function toOpenAITools(tools?: ToolDefinition[]): ChatCompletionTool[] | undefined {
  if (!tools?.length) return undefined;
  return tools.map((t) => ({
    type: "function" as const,
    function: { name: t.name, description: t.description, parameters: t.parameters },
  }));
}

class OpenAIProvider implements AIProvider {
  private client(): OpenAI {
    return new OpenAI({ apiKey: config.openaiApiKey });
  }

  async chat(messages: ChatMessage[], opts?: { tools?: ToolDefinition[]; temperature?: number }): Promise<ChatResult> {
    assertConfigured();
    const completion = await this.client().chat.completions.create({
      model: config.openaiModel,
      messages: toOpenAIMessages(messages),
      tools: toOpenAITools(opts?.tools),
      temperature: opts?.temperature ?? 0.6,
    });

    const message = completion.choices[0]?.message;
    const toolCalls: ToolCall[] | undefined = message?.tool_calls
      ?.filter((tc): tc is Extract<typeof tc, { type: "function" }> => tc.type === "function")
      .map((tc) => ({ id: tc.id, name: tc.function.name, arguments: tc.function.arguments }));

    return { content: message?.content ?? "", toolCalls };
  }

  async streamChat(
    messages: ChatMessage[],
    onToken: (delta: string) => void,
    opts?: { tools?: ToolDefinition[]; temperature?: number }
  ): Promise<ChatResult> {
    assertConfigured();
    const stream = await this.client().chat.completions.create({
      model: config.openaiModel,
      messages: toOpenAIMessages(messages),
      tools: toOpenAITools(opts?.tools),
      temperature: opts?.temperature ?? 0.6,
      stream: true,
    });

    let content = "";
    const toolCallsByIndex = new Map<number, { id: string; name: string; arguments: string }>();

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (delta?.content) {
        content += delta.content;
        onToken(delta.content);
      }
      for (const tc of delta?.tool_calls ?? []) {
        const existing = toolCallsByIndex.get(tc.index) ?? { id: "", name: "", arguments: "" };
        if (tc.id) existing.id = tc.id;
        if (tc.function?.name) existing.name += tc.function.name;
        if (tc.function?.arguments) existing.arguments += tc.function.arguments;
        toolCallsByIndex.set(tc.index, existing);
      }
    }

    const toolCalls = toolCallsByIndex.size > 0 ? Array.from(toolCallsByIndex.values()) : undefined;
    return { content, toolCalls };
  }

  async generateStructured<T>(input: GenerateStructuredInput<T>): Promise<T> {
    assertConfigured();
    const messages: ChatCompletionMessageParam[] = [];
    if (input.system) messages.push({ role: "system", content: input.system });
    messages.push({ role: "user", content: input.prompt });

    const completion = await this.client().chat.completions.parse({
      model: config.openaiModel,
      messages,
      temperature: input.temperature ?? 0.5,
      response_format: zodResponseFormat(input.schema, input.schemaName),
    });

    const parsed = completion.choices[0]?.message.parsed;
    if (!parsed) {
      throw new AppError(502, "The AI returned an unexpected response. Please try again.");
    }
    return parsed;
  }
}

export const aiProvider: AIProvider = new OpenAIProvider();
