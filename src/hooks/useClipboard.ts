import { useState } from "react";

export function useClipboard(resetAfterMs = 1500) {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText((current) => (current === text ? null : current)), resetAfterMs);
  };

  return { copy, copiedText };
}
