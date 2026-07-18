import { useNavigate } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Calendar01Icon, SparklesIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/composite/EmptyState";
import { useEvents } from "@/features/events/hooks/useEvents";
import { EventCard } from "@/features/events/components/EventCard";

export default function EventsPage() {
  const navigate = useNavigate();
  const { data, isPending } = useEvents({ upcomingOnly: true, limit: 30 });

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl font-semibold">Events</h1>
          <p className="text-sm text-muted-foreground">See what's coming up, or plan something new.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/events/create")}>
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} /> New event
          </Button>
          <Button onClick={() => navigate("/events/create/ai")}>
            <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} /> Plan with AI
          </Button>
        </div>
      </div>

      {isPending ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : !data || data.events.length === 0 ? (
        <EmptyState
          icon={<HugeiconsIcon icon={Calendar01Icon} strokeWidth={2} className="size-5" />}
          title="No upcoming events"
          description="Plan a get-together with your team, or let AI put one together in seconds."
          action={
            <Button size="sm" onClick={() => navigate("/events/create/ai")}>
              <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} /> Plan with AI
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {data.events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
