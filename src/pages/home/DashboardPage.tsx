import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import { SparklesIcon, Calendar01Icon } from "@hugeicons/core-free-icons";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/composite/EmptyState";
import { GradientAvatar } from "@/components/composite/GradientAvatar";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useBuddyDock } from "@/features/ai-buddy/context/BuddyDockContext";
import { useEvents } from "@/features/events/hooks/useEvents";
import { useWeeklyDigest } from "@/features/ai-digest/hooks/useDigest";
import { useCommunityRecommendations } from "@/features/ai-recommendations/hooks/useRecommendations";
import { useMatchSuggestions } from "@/features/ai-match-suggestions/hooks/useMatchSuggestions";
import { useMyCommunities } from "@/features/communities/hooks/useCommunities";
import { ConstellationFormingRow } from "@/features/ai-recommendations/components/ConstellationFormingRow";
import { getAvatarGradient } from "@/lib/gradientAvatar";

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
  const { data: eventsData } = useEvents({ upcomingOnly: true, joinedOnly: true, limit: 1 });
  const { data: digest } = useWeeklyDigest();
  const { data: recommendations, isPending: recsPending } = useCommunityRecommendations();
  const { data: matches } = useMatchSuggestions();
  const { data: myCommunities, isPending: communitiesPending } = useMyCommunities();

  const nextEvent = eventsData?.events[0];
  const starCount = matches?.length ?? 0;

  return (
    <div className="orbit-screen-in mx-auto grid max-w-6xl grid-cols-1 gap-8 p-6 lg:grid-cols-[1fr_320px] lg:items-start">
      <div className="min-w-0 space-y-8">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-[#0d1330] p-6 sm:p-9">
          <div
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{
              backgroundImage:
                "radial-gradient(1.3px 1.3px at 55% 30%, rgba(255,255,255,.5), transparent), radial-gradient(1px 1px at 80% 62%, rgba(255,255,255,.4), transparent), radial-gradient(1px 1px at 66% 84%, #ffe9b0, transparent), radial-gradient(1px 1px at 48% 22%, rgba(255,255,255,.35), transparent)",
            }}
          />
          <svg
            viewBox="0 0 300 200"
            className="pointer-events-none absolute top-1/2 right-6 hidden w-56 -translate-y-1/2 opacity-95 sm:block"
          >
            <polyline
              points="10,150 70,120 120,140 175,72 225,96 285,42"
              fill="none"
              stroke="rgba(200,208,255,.5)"
              strokeWidth={1.2}
              className="orbit-draw"
            />
            <circle cx={10} cy={150} r={3} fill="#cfe0ff" />
            <circle cx={70} cy={120} r={2.6} fill="#fff" />
            <circle cx={120} cy={140} r={2.6} fill="#fff" />
            <circle cx={175} cy={72} r={3.6} style={{ fill: "var(--color-primary)" }} className="orbit-twinkle" />
            <circle cx={225} cy={96} r={2.6} fill="#fff" />
            <circle cx={285} cy={42} r={3.6} style={{ fill: "var(--color-primary)" }} className="orbit-twinkle" />
          </svg>
          <div className="relative z-10 max-w-full sm:max-w-[58%]">
            <p className="font-eyebrow mb-4 text-[11px] text-primary">Tonight's sky</p>
            <p className="font-heading text-3xl leading-tight text-[#efe6cf] sm:text-[44px]">
              {starCount > 0
                ? `${starCount} star${starCount === 1 ? "" : "s"} ${starCount === 1 ? "is" : "are"} near yours, ${user?.firstName}.`
                : `${greeting()}, ${user?.firstName}.`}
            </p>
            <p className="mt-4 mb-6 text-sm leading-relaxed text-muted-foreground">
              Your AI Buddy has been charting coworkers, communities, and events worth connecting to.
            </p>
            <div className="flex flex-wrap items-center gap-6">
              <button
                type="button"
                onClick={() => openWithPrompt("Help me meet new people")}
                className="flex items-center gap-2 border-b border-primary pb-1 text-sm font-semibold text-[#efe6cf] transition-colors hover:text-foreground"
              >
                <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} className="size-3.5 text-primary" /> Ask my Buddy
              </button>
              <button
                type="button"
                onClick={() => openWithPrompt("Suggest something interesting this weekend")}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Suggest my weekend
              </button>
            </div>
          </div>
        </div>

        {/* Constellations forming */}
        <div>
          <p className="font-heading mb-3 text-2xl text-[#efe6cf]">Constellations forming</p>
          {recsPending ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ) : !recommendations || recommendations.length === 0 ? (
            <EmptyState
              icon={<HugeiconsIcon icon={SparklesIcon} strokeWidth={2} className="size-5" />}
              title="No new recommendations right now"
              description="Add a few interests to your profile and we'll surface communities worth joining."
            />
          ) : (
            <div>
              {recommendations.slice(0, 4).map((rec) => (
                <ConstellationFormingRow key={rec.communityId} recommendation={rec} />
              ))}
            </div>
          )}
        </div>

        {/* Stars to connect */}
        <div>
          <p className="font-heading mb-3 text-2xl text-[#efe6cf]">Stars to connect</p>
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
            <div className="flex shrink-0">
              {(matches ?? []).slice(0, 2).map((m, i) => (
                <GradientAvatar
                  key={m.userId}
                  seed={m.userId}
                  src={m.avatarUrl}
                  initials={`${m.firstName[0]}${m.lastName[0]}`}
                  alt={m.firstName}
                  size="lg"
                  className={i > 0 ? "-ml-2.5 ring-2 ring-card" : "ring-2 ring-card"}
                />
              ))}
              {(!matches || matches.length === 0) && (
                <div className="orbit-glow-icon flex size-10 items-center justify-center rounded-full text-primary">
                  <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} className="size-4" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold">Chart your interests</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Name a few and we'll show you the stars worth connecting with.
              </p>
            </div>
            <Button className="shrink-0" onClick={() => navigate("/profile/me")}>
              Add interests
            </Button>
          </div>
        </div>
      </div>

      {/* Right rail */}
      <div className="space-y-5">
        <div>
          <p className="font-heading mb-3 text-lg text-[#efe6cf]">Your constellations</p>
          {communitiesPending ? (
            <Skeleton className="h-14 w-full rounded-xl" />
          ) : !myCommunities || myCommunities.length === 0 ? (
            <p className="text-xs text-muted-foreground">Join a constellation to see it here.</p>
          ) : (
            <div className="space-y-1">
              {myCommunities.slice(0, 3).map((c) => (
                <button
                  key={c.id}
                  onClick={() => navigate(`/communities/${c.slug}`)}
                  className="flex w-full items-center gap-3 rounded-lg py-1.5 text-left transition-opacity hover:opacity-85"
                >
                  <span className="size-9 shrink-0 rounded-full" style={{ background: getAvatarGradient(c.id) }} />
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-semibold">{c.name}</p>
                    <p className="text-[11.5px] text-muted-foreground">{c.memberCount ?? 0} stars</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="h-px bg-border" />

        <div>
          <p className="font-heading mb-3 text-lg text-[#efe6cf]">On the horizon</p>
          {nextEvent ? (
            <button onClick={() => navigate(`/events/${nextEvent.id}`)} className="flex w-full items-start gap-3.5 text-left">
              <div className="w-11 shrink-0 text-center">
                <p className="font-eyebrow text-[10px] text-primary">{format(new Date(nextEvent.startsAt), "MMM")}</p>
                <p className="font-heading text-[28px] leading-none">{format(new Date(nextEvent.startsAt), "d")}</p>
              </div>
              <div className="min-w-0">
                <p className="text-[13.5px] leading-snug font-semibold">{nextEvent.title}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <HugeiconsIcon icon={Calendar01Icon} strokeWidth={2} className="size-3" />
                  {nextEvent.source === "ai_planner" ? "AI charted · " : ""}
                  {nextEvent.participantCount} going
                </p>
              </div>
            </button>
          ) : (
            <p className="text-xs text-muted-foreground">Nothing on your calendar yet.</p>
          )}
        </div>

        <div className="h-px bg-border" />

        <div>
          <p className="font-heading mb-2.5 text-lg text-[#efe6cf]">This week's sky</p>
          {digest ? (
            <button onClick={() => navigate("/digest")} className="block text-left">
              <p className="text-[13px] font-semibold">Your weekly digest is ready</p>
              <p className="mt-0.5 line-clamp-2 flex items-center gap-1 text-xs text-muted-foreground">
                {digest.narrative}
              </p>
            </button>
          ) : (
            <p className="text-xs text-muted-foreground">A pretty quiet week among the stars…</p>
          )}
        </div>
      </div>
    </div>
  );
}
