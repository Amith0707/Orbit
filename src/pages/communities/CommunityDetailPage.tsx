import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserGroupIcon, CheckmarkCircle02Icon, Calendar01Icon, Add01Icon } from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { GradientAvatar } from "@/components/composite/GradientAvatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EmptyState } from "@/components/composite/EmptyState";
import { getApiErrorMessage } from "@/lib/http/apiClient";
import { getAvatarTint } from "@/lib/gradientAvatar";
import { useCommunity, useCommunityMembers, useJoinCommunity, useLeaveCommunity } from "@/features/communities/hooks/useCommunities";
import { usePosts } from "@/features/communities/hooks/usePosts";
import { PostCard } from "@/features/communities/components/PostCard";
import { CreatePostComposer } from "@/features/communities/components/CreatePostComposer";
import { ChallengesSection } from "@/features/communities/components/ChallengesSection";
import { ConstellationMap } from "@/features/communities/components/ConstellationMap";
import { useEvents } from "@/features/events/hooks/useEvents";
import { EventCard } from "@/features/events/components/EventCard";

export default function CommunityDetailPage() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const { data: community, isPending } = useCommunity(slug ?? "");
  const { data: postsData, isPending: postsPending } = usePosts(slug ?? "");
  const { data: members } = useCommunityMembers(slug ?? "");
  const { data: eventsData, isPending: eventsPending } = useEvents({ communityId: community?.id, limit: 20 });
  const join = useJoinCommunity();
  const leave = useLeaveCommunity();

  if (isPending || !community) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 p-6">
        <Skeleton className="h-56 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const isMember = !!community.viewerRole;
  const canManage = community.viewerRole === "owner" || community.viewerRole === "moderator";
  const tint = getAvatarTint(community.id);
  const nextEvent = eventsData?.events[0];

  const handleJoinToggle = async () => {
    try {
      if (isMember) {
        await leave.mutateAsync(slug!);
        toast.success("Left community");
      } else {
        await join.mutateAsync(slug!);
        toast.success("Joined community");
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-6">
          <ConstellationMap
            name={community.name}
            tint={tint}
            stars={(members ?? []).map((m) => ({ id: m.userId, initials: `${m.firstName[0]}${m.lastName[0]}` }))}
          />

          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h1 className="font-heading text-2xl">{community.name}</h1>
              {community.description && <p className="text-sm text-muted-foreground">{community.description}</p>}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-xs text-muted-foreground">{community.memberCount ?? 0} stars</span>
                {community.tags.map((tag) => (
                  <Badge key={tag.id} variant="outline" className="text-[10px]">
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
            <Button
              variant={isMember ? "outline" : "default"}
              disabled={join.isPending || leave.isPending || community.viewerRole === "owner"}
              onClick={handleJoinToggle}
            >
              {isMember ? (
                <>
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} /> {community.viewerRole === "owner" ? "Owner" : "Joined"}
                </>
              ) : (
                "Join"
              )}
            </Button>
          </div>

          <Tabs defaultValue="feed">
            <TabsList>
              <TabsTrigger value="feed">Feed</TabsTrigger>
              <TabsTrigger value="challenges">Challenges</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="members">Stars</TabsTrigger>
            </TabsList>

            <TabsContent value="feed" className="space-y-4">
              {isMember && <CreatePostComposer slug={slug!} />}
              {postsPending ? (
                <div className="space-y-4">
                  <Skeleton className="h-40 w-full rounded-2xl" />
                  <Skeleton className="h-40 w-full rounded-2xl" />
                </div>
              ) : !postsData || postsData.posts.length === 0 ? (
                <EmptyState
                  icon={<HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} className="size-5" />}
                  title="No posts yet"
                  description={isMember ? "Be the first to share something!" : "Join to start the conversation."}
                />
              ) : (
                postsData.posts.map((post) => <PostCard key={post.id} post={post} canManage={canManage} />)
              )}
            </TabsContent>

            <TabsContent value="challenges">
              <ChallengesSection slug={slug!} canManage={canManage} />
            </TabsContent>

            <TabsContent value="events" className="space-y-4">
              {isMember && (
                <div className="flex justify-end">
                  <Button size="sm" variant="outline" onClick={() => navigate("/events/create")}>
                    <HugeiconsIcon icon={Add01Icon} strokeWidth={2} /> New event
                  </Button>
                </div>
              )}
              {eventsPending ? (
                <div className="space-y-4">
                  <Skeleton className="h-32 w-full rounded-2xl" />
                </div>
              ) : !eventsData || eventsData.events.length === 0 ? (
                <EmptyState
                  icon={<HugeiconsIcon icon={Calendar01Icon} strokeWidth={2} className="size-5" />}
                  title="No events yet"
                  description="Organize a get-together for this community."
                />
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {eventsData.events.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="members" className="space-y-2">
              {members?.map((member) => (
                <div key={member.userId} className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <GradientAvatar
                    seed={member.userId}
                    src={member.avatarUrl}
                    initials={`${member.firstName[0]}${member.lastName[0]}`}
                    alt={member.firstName}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {member.firstName} {member.lastName}
                    </p>
                    {member.jobTitle && <p className="text-xs text-muted-foreground">{member.jobTitle}</p>}
                  </div>
                  {member.role !== "member" && <Badge variant="secondary">{member.role}</Badge>}
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4">
          {nextEvent && (
            <Card className="border-ai-accent-border/40 bg-gradient-to-br from-ai-accent-soft to-transparent">
              <CardContent className="space-y-3">
                <p className="font-heading text-base">Next in this constellation</p>
                <div className="flex items-center gap-3">
                  <div className="w-11 shrink-0 text-center">
                    <p className="font-eyebrow text-[10px] text-ai-accent">{format(new Date(nextEvent.startsAt), "MMM")}</p>
                    <p className="font-heading text-xl leading-none">{format(new Date(nextEvent.startsAt), "d")}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{nextEvent.title}</p>
                    <p className="mt-0.5 truncate text-xs text-ai-accent/80">
                      {format(new Date(nextEvent.startsAt), "EEE · h:mm a")}
                      {nextEvent.location ? ` · ${nextEvent.location}` : ""}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="w-full" onClick={() => navigate(`/events/${nextEvent.id}`)}>
                  View event
                </Button>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardContent className="space-y-2">
              <p className="font-heading text-base">About</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                A {community.memberCount ?? 0}-star constellation. New stars are always welcome — connect with a few, or join to
                see everything.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
