import { useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { SparklesIcon, CheckmarkCircle01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/http/apiClient";
import { usePoll, useVotePoll, useClosePoll } from "../hooks/usePolls";

export function PollCard({ postId, canManage }: { postId: string; canManage: boolean }) {
  const { data: poll, isPending } = usePoll(postId, true);
  const vote = useVotePoll();
  const close = useClosePoll();
  const [selected, setSelected] = useState<string[]>([]);

  if (isPending || !poll) {
    return <div className="h-24 animate-pulse rounded-xl bg-muted" />;
  }

  const hasVoted = poll.viewerVoteOptionIds.length > 0;
  const showResults = hasVoted || poll.isClosed || poll.isPastDeadline;

  const toggleOption = (optionId: string) => {
    if (poll.allowMultipleChoices) {
      setSelected((prev) => (prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]));
    } else {
      setSelected([optionId]);
    }
  };

  const handleVote = async () => {
    if (selected.length === 0) return;
    try {
      await vote.mutateAsync({ postId, optionIds: selected });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleClose = async () => {
    try {
      await close.mutateAsync(postId);
      toast.success("Poll closed");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-border p-4">
      <div className="space-y-2">
        {poll.options.map((option) => {
          const isSelected = selected.includes(option.id) || poll.viewerVoteOptionIds.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              disabled={poll.isClosed || poll.isPastDeadline}
              onClick={() => toggleOption(option.id)}
              className={cn(
                "w-full space-y-1 rounded-lg border p-2.5 text-left text-sm transition-colors disabled:cursor-default",
                isSelected && !showResults ? "border-ai-accent-border bg-ai-accent-soft" : "border-border"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 font-medium">
                  {poll.viewerVoteOptionIds.includes(option.id) && (
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="size-3.5 text-ai-accent" />
                  )}
                  {option.label}
                </span>
                {showResults && <span className="text-xs text-muted-foreground">{option.percentage}%</span>}
              </div>
              {showResults && <Progress value={option.percentage} className="h-1.5" />}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {poll.totalVoters} vote{poll.totalVoters === 1 ? "" : "s"}
          {poll.isClosed && " · Closed"}
        </span>
        <div className="flex items-center gap-2">
          {!showResults && (
            <Button size="sm" disabled={selected.length === 0 || vote.isPending} onClick={handleVote}>
              {vote.isPending ? "Voting..." : "Vote"}
            </Button>
          )}
          {canManage && !poll.isClosed && (
            <Button size="sm" variant="outline" disabled={close.isPending} onClick={handleClose}>
              {close.isPending ? "Closing..." : "Close poll"}
            </Button>
          )}
        </div>
      </div>

      {poll.aiSummary && (
        <div className="flex items-start gap-1.5 rounded-lg border border-ai-accent-border/50 bg-ai-accent-soft p-2.5 text-xs text-foreground/90">
          <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} className="mt-0.5 size-3.5 shrink-0 text-ai-accent" />
          {poll.aiSummary}
        </div>
      )}
    </div>
  );
}
