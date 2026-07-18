import { useNavigate } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserGroupIcon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/composite/EmptyState";
import { useMyCommunities } from "../hooks/useCommunities";

export function MyCommunitiesCard() {
  const navigate = useNavigate();
  const { data, isPending } = useMyCommunities();

  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 font-heading text-sm font-semibold">
            <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} className="size-4" /> My communities
          </p>
          <button onClick={() => navigate("/communities")} className="text-xs text-muted-foreground hover:text-foreground">
            Browse all
          </button>
        </div>
        {isPending ? (
          <Skeleton className="h-16 w-full rounded-xl" />
        ) : !data || data.length === 0 ? (
          <EmptyState
            icon={<HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} className="size-4" />}
            title="No communities yet"
            description="Join a community to start connecting with coworkers."
            className="py-6"
          />
        ) : (
          <div className="space-y-2">
            {data.map((community) => (
              <button
                key={community.id}
                onClick={() => navigate(`/communities/${community.slug}`)}
                className="flex w-full items-center justify-between gap-2 rounded-xl border border-border p-3 text-left transition-colors hover:bg-muted"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{community.name}</p>
                  <p className="text-xs text-muted-foreground">{community.memberCount ?? 0} members</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {community.viewerRole && community.viewerRole !== "member" && (
                    <Badge variant="secondary" className="text-[10px] capitalize">
                      {community.viewerRole}
                    </Badge>
                  )}
                  <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-4 text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
