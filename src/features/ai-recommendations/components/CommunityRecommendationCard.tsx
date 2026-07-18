import { AnimatePresence, motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserGroupIcon, Cancel01Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { RecommendationCardShell } from "@/components/composite/RecommendationCardShell";
import { useJoinCommunity } from "@/features/communities/hooks/useCommunities";
import { useDismissCommunityRecommendation } from "../hooks/useRecommendations";
import type { CommunityRecommendation } from "../api/recommendations";

export function CommunityRecommendationCard({ recommendation }: { recommendation: CommunityRecommendation }) {
  const join = useJoinCommunity();
  const dismiss = useDismissCommunityRecommendation();
  const joined = join.isSuccess;

  return (
    <AnimatePresence>
      {!dismiss.isPending && (
        <motion.div
          layout
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
        >
          <RecommendationCardShell
            media={
              <div className="flex h-20 items-center justify-center bg-gradient-to-br from-ai-accent-soft to-muted">
                <HugeiconsIcon icon={UserGroupIcon} strokeWidth={1.5} className="size-8 text-ai-accent" />
              </div>
            }
            title={recommendation.name}
            subtitle={`${recommendation.memberCount} member${recommendation.memberCount === 1 ? "" : "s"}`}
            explanation={recommendation.explanation}
            footer={
              <div className="flex items-center gap-2 pb-4">
                <Button
                  size="sm"
                  className="flex-1"
                  disabled={join.isPending || joined}
                  onClick={() => join.mutate(recommendation.slug)}
                >
                  {joined ? (
                    <>
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} /> Joined
                    </>
                  ) : join.isPending ? (
                    "Joining..."
                  ) : (
                    "Join"
                  )}
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Not interested"
                  onClick={() => dismiss.mutate(recommendation.communityId)}
                >
                  <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
                </Button>
              </div>
            }
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
