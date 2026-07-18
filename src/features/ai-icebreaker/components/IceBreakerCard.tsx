import { HugeiconsIcon } from "@hugeicons/react";
import { SparklesIcon, Refresh01Icon, Copy01Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useClipboard } from "@/hooks/useClipboard";
import { useIceBreaker, useRegenerateIceBreaker } from "../hooks/useIceBreaker";

export function IceBreakerCard({ userId, firstName }: { userId: string; firstName: string }) {
  const { data, isPending } = useIceBreaker(userId);
  const regenerate = useRegenerateIceBreaker(userId);
  const { copy, copiedText } = useClipboard();

  const sharedChips = data
    ? [
        ...data.sharedInterests.map((name) => ({ name, kind: "interest" as const })),
        ...data.sharedHobbies.map((name) => ({ name, kind: "hobby" as const })),
        ...data.sharedSkills.map((name) => ({ name, kind: "skill" as const })),
      ]
    : [];

  return (
    <Card className="border-ai-accent-border/60 bg-gradient-to-br from-ai-accent-soft to-transparent">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} className="size-4 text-ai-accent" />
          Ice Breakers with {firstName}
        </CardTitle>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Regenerate"
          disabled={regenerate.isPending}
          onClick={() => regenerate.mutate()}
        >
          <HugeiconsIcon icon={Refresh01Icon} strokeWidth={2} className={regenerate.isPending ? "size-4 animate-spin" : "size-4"} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        {isPending ? (
          <div className="space-y-3">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase">You both...</p>
              {sharedChips.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {sharedChips.map((chip) => (
                    <Badge key={`${chip.kind}-${chip.name}`} variant="outline" className="border-ai-accent-border/60 bg-background">
                      {chip.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Haven't connected yet — here's a great place to start.</p>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase">Conversation starters</p>
              <ul className="space-y-2">
                {data?.conversationStarters.map((line, i) => (
                  <motion.li
                    key={line}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-2 rounded-xl border border-border bg-background/60 p-3 text-sm"
                  >
                    <span className="flex-1">{line}</span>
                    <button
                      type="button"
                      onClick={() => copy(line)}
                      aria-label="Copy"
                      className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <HugeiconsIcon
                        icon={copiedText === line ? CheckmarkCircle02Icon : Copy01Icon}
                        strokeWidth={2}
                        className="size-4"
                      />
                    </button>
                  </motion.li>
                ))}
              </ul>
            </div>

            {data?.commonalities && data.commonalities.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase">Why you'd click</p>
                <ul className="space-y-1 text-sm text-foreground/90">
                  {data.commonalities.map((line) => (
                    <li key={line} className="flex items-start gap-2">
                      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-ai-accent" />
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
