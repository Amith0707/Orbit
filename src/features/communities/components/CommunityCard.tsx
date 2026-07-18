import { useNavigate } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserGroupIcon } from "@hugeicons/core-free-icons";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Community } from "../api/communities";

export function CommunityCard({ community }: { community: Community }) {
  const navigate = useNavigate();

  return (
    <Card className="cursor-pointer gap-3 transition-shadow hover:shadow-md" onClick={() => navigate(`/communities/${community.slug}`)}>
      <div className="flex h-24 items-center justify-center bg-gradient-to-br from-muted to-secondary">
        <HugeiconsIcon icon={UserGroupIcon} strokeWidth={1.5} className="size-8 text-muted-foreground" />
      </div>
      <CardContent className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="font-heading text-sm font-medium">{community.name}</p>
          {community.viewerRole && <Badge variant="secondary">Joined</Badge>}
        </div>
        {community.description && <p className="line-clamp-2 text-xs text-muted-foreground">{community.description}</p>}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">{community.memberCount ?? 0} members</span>
          {community.tags.slice(0, 2).map((tag) => (
            <Badge key={tag.id} variant="outline" className="text-[10px]">
              {tag.name}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
