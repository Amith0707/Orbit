import type { ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { SparklesIcon } from "@hugeicons/core-free-icons";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function RecommendationCardShell({
  media,
  title,
  subtitle,
  explanation,
  footer,
  className,
}: {
  media?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  explanation: string;
  footer: ReactNode;
  className?: string;
}) {
  return (
    <Card size="sm" className={cn("w-72 shrink-0 gap-3", className)}>
      {media}
      <div className="space-y-1 px-4">
        <p className="font-heading text-sm font-medium">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="mx-4 flex items-start gap-1.5 rounded-xl border border-ai-accent-border/50 bg-ai-accent-soft px-3 py-2 text-xs text-foreground/90">
        <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} className="mt-0.5 size-3.5 shrink-0 text-ai-accent" />
        <span>{explanation}</span>
      </div>
      <div className="px-4">{footer}</div>
    </Card>
  );
}
