import ReactMarkdown from "react-markdown";
import { HugeiconsIcon } from "@hugeicons/react";
import { SparklesIcon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

export function ChatMessage({ role, content }: { role: "user" | "assistant"; content: string }) {
  const isAssistant = role === "assistant";

  return (
    <div className={cn("flex items-start gap-2.5", !isAssistant && "flex-row-reverse")}>
      {isAssistant && (
        <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-ai-accent text-ai-accent-foreground">
          <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} className="size-3.5" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm",
          isAssistant ? "bg-muted text-foreground" : "bg-primary text-primary-foreground"
        )}
      >
        <div className="space-y-2 [&_a]:underline [&_a]:underline-offset-2 [&_ol]:list-decimal [&_ol]:pl-4 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-4">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
