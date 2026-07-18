import { useEffect, useRef } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { SparklesIcon } from "@hugeicons/core-free-icons";
import { ChatMessage } from "./ChatMessage";
import { SuggestedPrompts } from "./SuggestedPrompts";
import type { BuddyMessage } from "../api/buddy";

export function ChatThread({
  messages,
  streamingText,
  isStreaming,
  onSelectPrompt,
}: {
  messages: BuddyMessage[];
  streamingText: string;
  isStreaming: boolean;
  onSelectPrompt: (prompt: string) => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-ai-accent-soft text-ai-accent">
          <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} className="size-5" />
        </div>
        <div>
          <p className="font-heading text-sm font-medium">Hey, I'm your AI Buddy</p>
          <p className="mt-1 text-xs text-muted-foreground">Ask me about communities, events, or coworkers you might click with.</p>
        </div>
        <SuggestedPrompts onSelect={onSelectPrompt} />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
      {messages.map((m) => (
        <ChatMessage key={m.id} role={m.role} content={m.content} />
      ))}
      {isStreaming && <ChatMessage role="assistant" content={streamingText || "..."} />}
      <div ref={bottomRef} />
    </div>
  );
}
