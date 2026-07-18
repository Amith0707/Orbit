import { useState, type KeyboardEvent } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { SentIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ChatComposer({ onSend, disabled }: { onSend: (text: string) => void; disabled?: boolean }) {
  const [value, setValue] = useState("");

  const handleSend = () => {
    if (!value.trim() || disabled) return;
    onSend(value);
    setValue("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-end gap-2 border-t border-border p-3">
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask your AI Buddy anything..."
        rows={1}
        className="max-h-32 min-h-9 resize-none py-2"
      />
      <Button size="icon-sm" onClick={handleSend} disabled={disabled || !value.trim()} aria-label="Send">
        <HugeiconsIcon icon={SentIcon} strokeWidth={2} className="size-4" />
      </Button>
    </div>
  );
}
