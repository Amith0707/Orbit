import { format } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import { SparklesIcon } from "@hugeicons/core-free-icons";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useWeeklyDigest } from "@/features/ai-digest/hooks/useDigest";

interface DigestStats {
  suggestedCoworkers?: unknown[];
  recommendedCommunities?: unknown[];
  upcomingEvents?: unknown[];
}

export default function WeeklyDigestPage() {
  const { data: digest, isPending } = useWeeklyDigest();
  const stats = (digest?.stats ?? {}) as DigestStats;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-center gap-2">
        <div className="flex size-9 items-center justify-center rounded-xl bg-ai-accent-soft text-ai-accent">
          <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} className="size-4" />
        </div>
        <div>
          <h1 className="font-heading text-2xl">This week's sky</h1>
          <p className="text-sm text-muted-foreground">
            {digest
              ? `${format(new Date(digest.weekStart), "MMM d")} – ${format(new Date(digest.weekEnd), "MMM d")}`
              : "What moved across your sky while you were away."}
          </p>
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
        <>
          <Card className="border-ai-accent-border/60 bg-gradient-to-br from-ai-accent-soft to-transparent">
            <CardContent>
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">{digest?.narrative}</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent>
                <p className="font-heading text-2xl text-primary">+{stats.suggestedCoworkers?.length ?? 0}</p>
                <p className="mt-1 text-xs text-muted-foreground">new stars near you</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="font-heading text-2xl" style={{ color: "#9fe0ff" }}>
                  {stats.recommendedCommunities?.length ?? 0}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">constellations to explore</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="font-heading text-2xl" style={{ color: "#8fe0a8" }}>
                  {stats.upcomingEvents?.length ?? 0}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">gatherings on the horizon</p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
