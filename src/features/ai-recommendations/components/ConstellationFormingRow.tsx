import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useJoinCommunity } from "@/features/communities/hooks/useCommunities";
import { getAvatarGradient } from "@/lib/gradientAvatar";
import type { CommunityRecommendation } from "../api/recommendations";

export function ConstellationFormingRow({ recommendation }: { recommendation: CommunityRecommendation }) {
  const navigate = useNavigate();
  const join = useJoinCommunity();
  const joined = join.isSuccess;

  return (
    <div
      onClick={() => navigate(`/communities/${recommendation.slug}`)}
      className="flex cursor-pointer items-center gap-4 border-t border-border py-4 transition-colors first:border-t-0 hover:bg-muted/40"
    >
      <span className="size-11 shrink-0 rounded-full" style={{ background: getAvatarGradient(recommendation.communityId) }} />
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold">{recommendation.name}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {recommendation.memberCount} star{recommendation.memberCount === 1 ? "" : "s"}
          {recommendation.description ? ` · ${recommendation.description}` : ""}
        </p>
      </div>
      <Button
        size="sm"
        variant={joined ? "outline" : "default"}
        className="shrink-0"
        disabled={join.isPending}
        onClick={(e) => {
          e.stopPropagation();
          if (joined) navigate(`/communities/${recommendation.slug}`);
          else join.mutate(recommendation.slug);
        }}
      >
        {join.isPending ? "Joining..." : joined ? "Joined" : "Join"}
      </Button>
    </div>
  );
}
