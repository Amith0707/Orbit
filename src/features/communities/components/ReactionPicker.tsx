import { HugeiconsIcon } from "@hugeicons/react";
import {
  ThumbsUpEllipseIcon,
  Fire03Icon,
  HeartHandshakeIcon,
  HeartAddIcon,
  Idea01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ReactionType } from "../api/posts";

export const REACTION_META: Record<ReactionType, { icon: typeof ThumbsUpEllipseIcon; label: string }> = {
  like: { icon: ThumbsUpEllipseIcon, label: "Like" },
  celebrate: { icon: Fire03Icon, label: "Celebrate" },
  support: { icon: HeartHandshakeIcon, label: "Support" },
  love: { icon: HeartAddIcon, label: "Love" },
  insightful: { icon: Idea01Icon, label: "Insightful" },
  curious: { icon: Search01Icon, label: "Curious" },
};

export function ReactionPicker({
  viewerReaction,
  onSelect,
}: {
  viewerReaction: ReactionType | null;
  onSelect: (reaction: ReactionType) => void;
}) {
  const current = viewerReaction ? REACTION_META[viewerReaction] : null;

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className={cn(current && "text-ai-accent")}
          />
        }
      >
        <HugeiconsIcon icon={current?.icon ?? ThumbsUpEllipseIcon} strokeWidth={2} className="size-4" />
        {current?.label ?? "React"}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-1.5">
        <div className="flex gap-1">
          {(Object.entries(REACTION_META) as [ReactionType, (typeof REACTION_META)[ReactionType]][]).map(
            ([type, meta]) => (
              <button
                key={type}
                type="button"
                onClick={() => onSelect(type)}
                title={meta.label}
                className={cn(
                  "flex size-9 items-center justify-center rounded-full transition-colors hover:bg-muted",
                  viewerReaction === type && "bg-ai-accent-soft text-ai-accent"
                )}
              >
                <HugeiconsIcon icon={meta.icon} strokeWidth={2} className="size-4" />
              </button>
            )
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
