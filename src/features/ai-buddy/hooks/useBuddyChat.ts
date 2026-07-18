import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { streamBuddyMessage } from "@/lib/http/sse";
import { getThread } from "../api/buddy";
import type { BuddyMessage } from "../api/buddy";

export function useBuddyChat(initialConversationId?: string) {
  const [conversationId, setConversationId] = useState(initialConversationId);
  const [messages, setMessages] = useState<BuddyMessage[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const queryClient = useQueryClient();
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setConversationId(initialConversationId);
  }, [initialConversationId]);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    setIsLoadingHistory(true);
    getThread(conversationId)
      .then((thread) => setMessages(thread.messages))
      .finally(() => setIsLoadingHistory(false));
  }, [conversationId]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;

    const userMessage: BuddyMessage = {
      id: `local-${Date.now()}`,
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsStreaming(true);
    setStreamingText("");

    const controller = new AbortController();
    abortRef.current = controller;

    await streamBuddyMessage(
      { conversationId, message: trimmed },
      {
        onToken: (delta) => setStreamingText((prev) => prev + delta),
        onDone: ({ conversationId: newConversationId, message }) => {
          setConversationId(newConversationId);
          setMessages((prev) => [
            ...prev,
            { id: `local-${Date.now()}-assistant`, role: "assistant", content: message, createdAt: new Date().toISOString() },
          ]);
          setStreamingText("");
          setIsStreaming(false);
          queryClient.invalidateQueries({ queryKey: ["ai", "buddy", "threads"] });
        },
        onError: (err) => {
          toast.error(err.message || "The AI Buddy couldn't respond. Please try again.");
          setIsStreaming(false);
          setStreamingText("");
        },
      },
      controller.signal
    );
  };

  return { conversationId, messages, streamingText, isStreaming, isLoadingHistory, send, setConversationId };
}
