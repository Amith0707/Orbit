import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { RecommendationCardShell } from "@/components/composite/RecommendationCardShell";
import { useDismissMatchSuggestion } from "../hooks/useMatchSuggestions";
import type { MatchSuggestion } from "../api/matches";

export function MatchSuggestionCard({ suggestion }: { suggestion: MatchSuggestion }) {
  const navigate = useNavigate();
  const dismiss = useDismissMatchSuggestion();

  return (
    <AnimatePresence>
      {!dismiss.isPending && (
        <motion.div layout initial={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}>
          <RecommendationCardShell
            media={
              <div className="flex h-20 items-center justify-center bg-gradient-to-br from-ai-accent-soft to-muted">
                <Avatar size="lg">
                  <AvatarImage src={suggestion.avatarUrl ?? undefined} alt={suggestion.firstName} />
                  <AvatarFallback>
                    {suggestion.firstName[0]}
                    {suggestion.lastName[0]}
                  </AvatarFallback>
                </Avatar>
              </div>
            }
            title={`${suggestion.firstName} ${suggestion.lastName}`}
            subtitle={suggestion.jobTitle ?? undefined}
            explanation={suggestion.explanation}
            footer={
              <div className="flex items-center gap-2 pb-4">
                <Button size="sm" className="flex-1" onClick={() => navigate(`/people/${suggestion.userId}`)}>
                  Connect
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Not interested"
                  onClick={() => dismiss.mutate(suggestion.userId)}
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
