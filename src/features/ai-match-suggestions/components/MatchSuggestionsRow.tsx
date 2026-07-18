import { HugeiconsIcon } from "@hugeicons/react";
import { SparklesIcon, User02Icon } from "@hugeicons/core-free-icons";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/composite/EmptyState";
import { useMatchSuggestions } from "../hooks/useMatchSuggestions";
import { MatchSuggestionCard } from "./MatchSuggestionCard";

export function MatchSuggestionsRow() {
  const { data, isPending } = useMatchSuggestions();

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} className="size-4 text-ai-accent" />
        <h2 className="font-heading text-lg">Stars to connect</h2>
      </div>
      {isPending ? (
        <div className="flex gap-4 overflow-hidden">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-56 w-72 shrink-0 rounded-2xl" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={<HugeiconsIcon icon={User02Icon} strokeWidth={2} className="size-5" />}
          title="No new matches right now"
          description="As more coworkers fill out their interests, we'll suggest people worth connecting with."
        />
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {data.map((s) => (
            <MatchSuggestionCard key={s.userId} suggestion={s} />
          ))}
        </div>
      )}
    </section>
  );
}
