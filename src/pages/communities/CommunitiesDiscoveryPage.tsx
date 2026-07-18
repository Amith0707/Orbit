import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon, Add01Icon, UserGroupIcon, SparklesIcon } from "@hugeicons/core-free-icons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/composite/EmptyState";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useCommunities } from "@/features/communities/hooks/useCommunities";
import { CommunityCard } from "@/features/communities/components/CommunityCard";
import { RecommendedCommunitiesRow } from "@/features/ai-recommendations/components/RecommendedCommunitiesRow";
import { useCommunityRecommendations } from "@/features/ai-recommendations/hooks/useRecommendations";

export default function CommunitiesDiscoveryPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const { data, isPending } = useCommunities({ search: debouncedSearch || undefined, limit: 24 });
  const { data: recommendations } = useCommunityRecommendations();

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl">Constellations</h1>
          <p className="text-sm text-muted-foreground">Groups of people, drawn together by what they love.</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/communities/create")}>
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} /> Form a constellation
        </Button>
      </div>

      {recommendations && recommendations.length > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-card/70 px-4.5 py-3.5">
          <div className="orbit-glow-icon flex size-8 shrink-0 items-center justify-center rounded-full text-primary">
            <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} className="size-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">
              Your Buddy charted {recommendations.length} constellation{recommendations.length === 1 ? "" : "s"} for you
            </p>
            <p className="text-xs text-muted-foreground">Drawn from the interests on your profile.</p>
          </div>
        </div>
      )}

      <RecommendedCommunitiesRow />

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="size-4 text-muted-foreground" />
          <Input
            placeholder="Search all communities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {isPending ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        ) : !data || data.communities.length === 0 ? (
          <EmptyState
            icon={<HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} className="size-5" />}
            title="No communities found"
            description="Try a different search, or start your own community."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.communities.map((community) => (
              <CommunityCard key={community.id} community={community} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
