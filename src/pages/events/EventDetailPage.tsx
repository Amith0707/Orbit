import { useParams } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar01Icon,
  Location01Icon,
  Clock01Icon,
  SparklesIcon,
  UserMultiple02Icon,
  DollarCircleIcon,
} from "@hugeicons/core-free-icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/http/apiClient";
import { useEvent, useEventParticipants, useRsvpToEvent, useRemoveRsvp } from "@/features/events/hooks/useEvents";
import type { RsvpStatus } from "@/features/events/api/events";

const RSVP_OPTIONS: { value: RsvpStatus; label: string }[] = [
  { value: "going", label: "Going" },
  { value: "interested", label: "Interested" },
  { value: "declined", label: "Can't go" },
];

export default function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { data: event, isPending } = useEvent(eventId ?? "");
  const { data: participants } = useEventParticipants(eventId ?? "");
  const rsvp = useRsvpToEvent();
  const removeRsvp = useRemoveRsvp();

  if (isPending || !event) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-6">
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  const handleRsvp = async (status: RsvpStatus) => {
    try {
      if (event.viewerRsvpStatus === status) {
        await removeRsvp.mutateAsync(event.id);
      } else {
        await rsvp.mutateAsync({ eventId: event.id, status });
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h1 className="font-heading text-xl font-semibold">{event.title}</h1>
          {event.source === "ai_planner" && (
            <Badge variant="outline" className="gap-1 border-ai-accent-border text-ai-accent">
              <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} className="size-3" /> AI planned
            </Badge>
          )}
        </div>
        <p className="text-sm text-foreground/90">{event.description}</p>
      </div>

      <Card>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Calendar01Icon} strokeWidth={2} className="size-4 text-muted-foreground" />
            {format(new Date(event.startsAt), "EEEE, MMM d 'at' h:mm a")}
          </div>
          {event.durationMinutes && (
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-4 text-muted-foreground" />
              {event.durationMinutes} minutes
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={Location01Icon} strokeWidth={2} className="size-4 text-muted-foreground" />
              {event.location}
            </div>
          )}
          {event.estimatedCost !== null && (
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={DollarCircleIcon} strokeWidth={2} className="size-4 text-muted-foreground" />
              ~${event.estimatedCost} per person
            </div>
          )}
          {(event.idealGroupSizeMin || event.idealGroupSizeMax) && (
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={UserMultiple02Icon} strokeWidth={2} className="size-4 text-muted-foreground" />
              {event.idealGroupSizeMin}–{event.idealGroupSizeMax} people
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        {RSVP_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            size="sm"
            variant={event.viewerRsvpStatus === opt.value ? "default" : "outline"}
            disabled={rsvp.isPending || removeRsvp.isPending}
            onClick={() => handleRsvp(opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {event.agenda.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Agenda</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-1.5 text-sm text-foreground/90">
              {event.agenda.map((item, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-muted-foreground">{i + 1}.</span> {item}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {event.thingsToBring.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Things to bring</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1.5">
            {event.thingsToBring.map((item) => (
              <Badge key={item} variant="secondary">
                {item}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Who's going ({participants?.filter((p) => p.rsvpStatus === "going").length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {participants?.map((p) => (
            <div key={p.userId} className="flex items-center gap-2.5">
              <Avatar size="sm">
                <AvatarImage src={p.avatarUrl ?? undefined} alt={p.firstName} />
                <AvatarFallback>
                  {p.firstName[0]}
                  {p.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">
                {p.firstName} {p.lastName}
              </span>
              <Badge variant="outline" className={cn("ml-auto text-[10px] capitalize")}>
                {p.rsvpStatus}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
