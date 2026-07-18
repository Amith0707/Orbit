import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { SparklesIcon, Add01Icon, Cancel01Icon, ArrowExpandIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { useBuddyDock } from "../context/BuddyDockContext";
import { useBuddyChat } from "../hooks/useBuddyChat";
import { ChatThread } from "./ChatThread";
import { ChatComposer } from "./ChatComposer";

export function BuddyPanel() {
  const { close, consumePendingPrompt } = useBuddyDock();
  const navigate = useNavigate();
  const { messages, streamingText, isStreaming, send, setConversationId } = useBuddyChat();

  useEffect(() => {
    const prompt = consumePendingPrompt();
    if (prompt) send(prompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.98 }}
      transition={{ duration: 0.15 }}
      className="fixed right-6 bottom-24 z-50 flex h-[560px] w-96 max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-full bg-ai-accent text-ai-accent-foreground">
            <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} className="size-3.5" />
          </div>
          <p className="font-heading text-sm font-medium">AI Buddy</p>
        </div>
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon-sm" aria-label="New chat" onClick={() => setConversationId(undefined)}>
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Expand"
            onClick={() => {
              close();
              navigate("/ai-buddy");
            }}
          >
            <HugeiconsIcon icon={ArrowExpandIcon} strokeWidth={2} className="size-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={close}>
            <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-4" />
          </Button>
        </div>
      </div>

      <ChatThread messages={messages} streamingText={streamingText} isStreaming={isStreaming} onSelectPrompt={send} />
      <ChatComposer onSend={send} disabled={isStreaming} />
    </motion.div>
  );
}
