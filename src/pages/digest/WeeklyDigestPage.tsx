import { format } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import { SparklesIcon } from "@hugeicons/core-free-icons";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useWeeklyDigest } from "@/features/ai-digest/hooks/useDigest";

export default function WeeklyDigestPage() {
  const { data: digest, isPending } = useWeeklyDigest();

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-center gap-2">
        <div className="flex size-9 items-center justify-center rounded-xl bg-ai-accent-soft text-ai-accent">
          <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} className="size-4" />
        </div>
        <div>
          <h1 className="font-heading text-xl font-semibold">Your Weekly Digest</h1>
          {digest && (
            <p className="text-sm text-muted-foreground">
              {format(new Date(digest.weekStart), "MMM d")} – {format(new Date(digest.weekEnd), "MMM d")}
            </p>
          )}
        </div>
      </div>

      {isPending ? (
        <Card>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </CardContent>
        </Card>
      ) : (
        <Card className="border-ai-accent-border/60 bg-gradient-to-br from-ai-accent-soft to-transparent">
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">{digest?.narrative}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
