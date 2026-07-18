import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon, User02Icon } from "@hugeicons/core-free-icons";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { GradientAvatar } from "@/components/composite/GradientAvatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/composite/EmptyState";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useDirectory } from "@/features/profile/hooks/useProfile";
import { MatchSuggestionsRow } from "@/features/ai-match-suggestions/components/MatchSuggestionsRow";

export default function PeoplePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const { data, isPending } = useDirectory({ search: debouncedSearch || undefined, limit: 40 });

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div>
        <h1 className="font-heading text-2xl">The night's stars</h1>
        <p className="text-sm text-muted-foreground">Everyone at Calfus is a star. Find the ones near yours.</p>
      </div>

      <MatchSuggestionsRow />

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="size-4 text-muted-foreground" />
          <Input placeholder="Search by name..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
        </div>

        {isPending ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
        ) : !data || data.users.length === 0 ? (
          <EmptyState icon={<HugeiconsIcon icon={User02Icon} strokeWidth={2} className="size-5" />} title="No coworkers found" />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.users.map((u) => (
              <Card key={u.id} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => navigate(`/people/${u.id}`)}>
                <CardContent className="flex items-center gap-3">
                  <GradientAvatar
                    src={u.avatarUrl}
                    seed={u.id}
                    initials={`${u.firstName[0]}${u.lastName[0]}`}
                    alt={u.firstName}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {u.firstName} {u.lastName}
                    </p>
                    {u.jobTitle && <p className="truncate text-xs text-muted-foreground">{u.jobTitle}</p>}
                    {u.department && (
                      <Badge variant="outline" className="mt-1 text-[10px]">
                        {u.department.name}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
