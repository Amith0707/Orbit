import { useSearchParams } from "react-router-dom";
import { formatDistanceToNowStrict } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import { SparklesIcon, Add01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useBuddyThreads } from "@/features/ai-buddy/hooks/useBuddyThreads";
import { useBuddyChat } from "@/features/ai-buddy/hooks/useBuddyChat";
import { ChatThread } from "@/features/ai-buddy/components/ChatThread";
import { ChatComposer } from "@/features/ai-buddy/components/ChatComposer";

export default function AiBuddyPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeThreadId = searchParams.get("thread") ?? undefined;
  const { data: threads } = useBuddyThreads();
  const { messages, streamingText, isStreaming, send, setConversationId, conversationId } = useBuddyChat(activeThreadId);

  const selectThread = (id: string | undefined) => {
    setConversationId(id);
    setSearchParams(id ? { thread: id } : {});
  };

  return (
    <div className="flex h-full">
      <div className="hidden w-64 shrink-0 flex-col border-r border-border sm:flex">
        <div className="flex items-center justify-between p-3">
          <p className="font-heading text-sm font-medium">Conversations</p>
          <Button variant="ghost" size="icon-sm" aria-label="New chat" onClick={() => selectThread(undefined)}>
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-4" />
          </Button>
        </div>
        <div className="flex-1 space-y-1 overflow-y-auto px-2">
          {threads?.map((t) => (
            <button
              key={t.id}
              onClick={() => selectThread(t.id)}
              className={cn(
                "w-full truncate rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                conversationId === t.id && "bg-muted"
              )}
            >
              <p className="truncate font-medium">{t.title}</p>
              <p className="text-xs text-muted-foreground">{formatDistanceToNowStrict(new Date(t.updatedAt), { addSuffix: true })}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <div className="flex size-7 items-center justify-center rounded-full bg-ai-accent text-ai-accent-foreground">
            <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} className="size-3.5" />
          </div>
          <p className="font-heading text-sm font-medium">AI Buddy</p>
        </div>
        <ChatThread messages={messages} streamingText={streamingText} isStreaming={isStreaming} onSelectPrompt={send} />
        <ChatComposer onSend={send} disabled={isStreaming} />
      </div>
    </div>
  );
}
