import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar01Icon, Location01Icon, UserMultiple02Icon, SparklesIcon } from "@hugeicons/core-free-icons";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { EventItem } from "../api/events";

export function EventCard({ event }: { event: EventItem }) {
  const navigate = useNavigate();
  const date = new Date(event.startsAt);

  return (
    <Card className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => navigate(`/events/${event.id}`)}>
      <CardContent className="flex items-center gap-4">
        <div className="w-12 shrink-0 text-center">
          <p className="font-eyebrow text-[10px] text-primary">{format(date, "MMM")}</p>
          <p className="font-heading text-2xl leading-none">{format(date, "d")}</p>
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate font-heading text-base">{event.title}</p>
            {event.source === "ai_planner" && (
              <Badge variant="outline" className="shrink-0 gap-1 border-ai-accent-border text-ai-accent">
                <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} className="size-3" /> AI charted
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <HugeiconsIcon icon={Calendar01Icon} strokeWidth={2} className="size-3.5" />
              {format(date, "h:mm a")}
            </span>
            {event.location && (
              <span className="flex items-center gap-1">
                <HugeiconsIcon icon={Location01Icon} strokeWidth={2} className="size-3.5" /> {event.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <HugeiconsIcon icon={UserMultiple02Icon} strokeWidth={2} className="size-3.5" /> {event.participantCount} going
            </span>
          </div>
          {event.viewerRsvpStatus && (
            <Badge variant="secondary" className="capitalize">
              {event.viewerRsvpStatus}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
