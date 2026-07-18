import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserGroupIcon, Calendar01Icon, ChatIcon, User02Icon } from "@hugeicons/core-free-icons";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { searchAll } from "@/features/search/api/search";

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 250);
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ["search", "palette", debouncedQuery],
    queryFn: () => searchAll(debouncedQuery, 4),
    enabled: debouncedQuery.trim().length > 1,
  });

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const go = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  const hasResults =
    data && (data.users.length > 0 || data.communities.length > 0 || data.events.length > 0 || data.posts.length > 0);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Search Calfus Orbit" description="Find people, communities, events, and posts">
      <CommandInput placeholder="Search people, communities, events..." value={query} onValueChange={setQuery} />
      <CommandList>
        {query.trim().length > 1 && !hasResults && <CommandEmpty>No results for "{query}"</CommandEmpty>}
        {query.trim().length <= 1 && (
          <CommandGroup heading="Quick links">
            <CommandItem onSelect={() => go("/communities")}>
              <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} /> Discover communities
            </CommandItem>
            <CommandItem onSelect={() => go("/events")}>
              <HugeiconsIcon icon={Calendar01Icon} strokeWidth={2} /> Browse events
            </CommandItem>
            <CommandItem onSelect={() => go("/people")}>
              <HugeiconsIcon icon={User02Icon} strokeWidth={2} /> Find coworkers
            </CommandItem>
          </CommandGroup>
        )}
        {data && data.users.length > 0 && (
          <CommandGroup heading="People">
            {data.users.map((u) => (
              <CommandItem key={u.id} onSelect={() => go(`/people/${u.id}`)}>
                <HugeiconsIcon icon={User02Icon} strokeWidth={2} />
                {u.firstName} {u.lastName}
                {u.jobTitle && <span className="ml-auto text-xs text-muted-foreground">{u.jobTitle}</span>}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {data && data.communities.length > 0 && (
          <CommandGroup heading="Communities">
            {data.communities.map((c) => (
              <CommandItem key={c.id} onSelect={() => go(`/communities/${c.slug}`)}>
                <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} />
                {c.name}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {data && data.events.length > 0 && (
          <CommandGroup heading="Events">
            {data.events.map((e) => (
              <CommandItem key={e.id} onSelect={() => go(`/events/${e.id}`)}>
                <HugeiconsIcon icon={Calendar01Icon} strokeWidth={2} />
                {e.title}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {data && data.posts.length > 0 && (
          <CommandGroup heading="Posts">
            {data.posts.map((p) => (
              <CommandItem key={p.id} onSelect={() => go(`/communities/posts/${p.id}`)}>
                <HugeiconsIcon icon={ChatIcon} strokeWidth={2} />
                <span className="truncate">{p.body}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
