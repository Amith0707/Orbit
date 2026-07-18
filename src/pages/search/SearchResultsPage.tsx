import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon, UserGroupIcon, Calendar01Icon, User02Icon, ChatIcon } from "@hugeicons/core-free-icons";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/composite/EmptyState";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { searchAll } from "@/features/search/api/search";

function ResultSection({ title, icon, children }: { title: string; icon: typeof Search01Icon; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
        <HugeiconsIcon icon={icon} strokeWidth={2} className="size-4" /> {title}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const debouncedQuery = useDebouncedValue(query, 300);

  const { data, isPending } = useQuery({
    queryKey: ["search", "page", debouncedQuery],
    queryFn: () => searchAll(debouncedQuery, 10),
    enabled: debouncedQuery.trim().length > 1,
  });

  const handleChange = (value: string) => {
    setQuery(value);
    setSearchParams(value ? { q: value } : {});
  };

  const hasResults =
    data && (data.users.length > 0 || data.communities.length > 0 || data.events.length > 0 || data.posts.length > 0);

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-center gap-2">
        <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="size-4 text-muted-foreground" />
        <Input
          autoFocus
          placeholder="Search people, communities, events, posts..."
          value={query}
          onChange={(e) => handleChange(e.target.value)}
        />
      </div>

      {debouncedQuery.trim().length <= 1 ? (
        <EmptyState
          icon={<HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="size-5" />}
          title="Search Calfus Orbit"
          description="Find coworkers, communities, events, and posts."
        />
      ) : isPending ? (
        <p className="text-sm text-muted-foreground">Searching...</p>
      ) : !hasResults ? (
        <EmptyState icon={<HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="size-5" />} title={`No results for "${debouncedQuery}"`} />
      ) : (
        <div className="space-y-6">
          {data.users.length > 0 && (
            <ResultSection title="People" icon={User02Icon}>
              {data.users.map((u) => (
                <Card key={u.id} className="cursor-pointer" onClick={() => navigate(`/people/${u.id}`)}>
                  <CardContent className="py-3">
                    <p className="text-sm font-medium">
                      {u.firstName} {u.lastName}
                    </p>
                    {u.jobTitle && <p className="text-xs text-muted-foreground">{u.jobTitle}</p>}
                  </CardContent>
                </Card>
              ))}
            </ResultSection>
          )}
          {data.communities.length > 0 && (
            <ResultSection title="Communities" icon={UserGroupIcon}>
              {data.communities.map((c) => (
                <Card key={c.id} className="cursor-pointer" onClick={() => navigate(`/communities/${c.slug}`)}>
                  <CardContent className="py-3">
                    <p className="text-sm font-medium">{c.name}</p>
                    {c.description && <p className="line-clamp-1 text-xs text-muted-foreground">{c.description}</p>}
                  </CardContent>
                </Card>
              ))}
            </ResultSection>
          )}
          {data.events.length > 0 && (
            <ResultSection title="Events" icon={Calendar01Icon}>
              {data.events.map((e) => (
                <Card key={e.id} className="cursor-pointer" onClick={() => navigate(`/events/${e.id}`)}>
                  <CardContent className="py-3">
                    <p className="text-sm font-medium">{e.title}</p>
                  </CardContent>
                </Card>
              ))}
            </ResultSection>
          )}
          {data.posts.length > 0 && (
            <ResultSection title="Posts" icon={ChatIcon}>
              {data.posts.map((p) => (
                <Card key={p.id} className="cursor-pointer" onClick={() => navigate(`/communities/posts/${p.id}`)}>
                  <CardContent className="py-3">
                    <p className="line-clamp-2 text-sm">{p.body}</p>
                  </CardContent>
                </Card>
              ))}
            </ResultSection>
          )}
        </div>
      )}
    </div>
  );
}
