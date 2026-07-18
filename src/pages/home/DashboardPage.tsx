import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import { SparklesIcon, Calendar01Icon, Notification02Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/composite/EmptyState";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useBuddyDock } from "@/features/ai-buddy/context/BuddyDockContext";
import { useEvents } from "@/features/events/hooks/useEvents";
import { useNotifications } from "@/features/notifications/hooks/useNotifications";
import { useWeeklyDigest } from "@/features/ai-digest/hooks/useDigest";
import { RecommendedCommunitiesRow } from "@/features/ai-recommendations/components/RecommendedCommunitiesRow";
import { MatchSuggestionsRow } from "@/features/ai-match-suggestions/components/MatchSuggestionsRow";
import { MyCommunitiesCard } from "@/features/communities/components/MyCommunitiesCard";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { openWithPrompt } = useBuddyDock();
  const { data: eventsData, isPending: eventsPending } = useEvents({ upcomingOnly: true, joinedOnly: true, limit: 4 });
  const { data: notificationsData } = useNotifications({ limit: 4 });
  const { data: digest } = useWeeklyDigest();

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      <Card className="border-ai-accent-border/60 bg-gradient-to-br from-ai-accent-soft via-transparent to-transparent">
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-ai-accent text-ai-accent-foreground">
              <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} className="size-5" />
            </div>
            <div>
              <p className="font-heading text-lg font-semibold">
                {greeting()}, {user?.firstName}
              </p>
              <p className="text-sm text-muted-foreground">
                Your AI Buddy has been keeping an eye on communities, events, and coworkers worth knowing about.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => openWithPrompt("Suggest something interesting this weekend")}>
              Suggest my weekend
            </Button>
            <Button size="sm" onClick={() => openWithPrompt("Help me meet new people")}>
              <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} /> Ask my Buddy
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <RecommendedCommunitiesRow />
          <MatchSuggestionsRow />
        </div>

        <div className="space-y-6">
          <MyCommunitiesCard />

          <Card>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-1.5 font-heading text-sm font-semibold">
                  <HugeiconsIcon icon={Calendar01Icon} strokeWidth={2} className="size-4" /> Upcoming events
                </p>
                <button onClick={() => navigate("/events")} className="text-xs text-muted-foreground hover:text-foreground">
                  View all
                </button>
              </div>
              {eventsPending ? (
                <Skeleton className="h-16 w-full rounded-xl" />
              ) : !eventsData || eventsData.events.length === 0 ? (
                <EmptyState
                  icon={<HugeiconsIcon icon={Calendar01Icon} strokeWidth={2} className="size-4" />}
                  title="Nothing on your calendar"
                  description="Browse events or let AI plan one."
                  className="py-6"
                />
              ) : (
                <div className="space-y-2">
                  {eventsData.events.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => navigate(`/events/${event.id}`)}
                      className="flex w-full items-center justify-between gap-2 rounded-xl border border-border p-3 text-left transition-colors hover:bg-muted"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{event.title}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(event.startsAt), "EEE, MMM d · h:mm a")}</p>
                      </div>
                      <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-4 shrink-0 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-1.5 font-heading text-sm font-semibold">
                  <HugeiconsIcon icon={Notification02Icon} strokeWidth={2} className="size-4" /> Recent activity
                </p>
                <button onClick={() => navigate("/notifications")} className="text-xs text-muted-foreground hover:text-foreground">
                  View all
                </button>
              </div>
              {!notificationsData || notificationsData.notifications.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">No activity yet.</p>
              ) : (
                <div className="space-y-2">
                  {notificationsData.notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => n.linkUrl && navigate(n.linkUrl)}
                      className="block w-full rounded-xl border border-border p-3 text-left text-sm transition-colors hover:bg-muted"
                    >
                      <p className="truncate font-medium">{n.title}</p>
                      {n.body && <p className="truncate text-xs text-muted-foreground">{n.body}</p>}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {digest && (
            <Card className="cursor-pointer border-ai-accent-border/60 bg-ai-accent-soft" onClick={() => navigate("/digest")}>
              <CardContent className="space-y-1.5">
                <p className="flex items-center gap-1.5 font-heading text-sm font-semibold text-ai-accent">
                  <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} className="size-4" /> Weekly Digest
                </p>
                <p className="line-clamp-2 text-xs text-foreground/80">{digest.narrative}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
