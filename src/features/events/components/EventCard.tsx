import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar01Icon, Location01Icon, UserMultiple02Icon, SparklesIcon } from "@hugeicons/core-free-icons";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { EventItem } from "../api/events";

export function EventCard({ event }: { event: EventItem }) {
  const navigate = useNavigate();

  return (
    <Card className="cursor-pointer gap-3 transition-shadow hover:shadow-md" onClick={() => navigate(`/events/${event.id}`)}>
      <CardContent className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="font-heading text-sm font-medium">{event.title}</p>
          {event.source === "ai_planner" && (
            <Badge variant="outline" className="gap-1 border-ai-accent-border text-ai-accent">
              <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} className="size-3" /> AI planned
            </Badge>
          )}
        </div>
        <p className="line-clamp-2 text-xs text-muted-foreground">{event.description}</p>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <HugeiconsIcon icon={Calendar01Icon} strokeWidth={2} className="size-3.5" />
            {format(new Date(event.startsAt), "EEE, MMM d · h:mm a")}
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
      </CardContent>
    </Card>
  );
}
