import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserGroupIcon, CheckmarkCircle02Icon, Calendar01Icon, Add01Icon } from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EmptyState } from "@/components/composite/EmptyState";
import { getApiErrorMessage } from "@/lib/http/apiClient";
import { useCommunity, useCommunityMembers, useJoinCommunity, useLeaveCommunity } from "@/features/communities/hooks/useCommunities";
import { usePosts } from "@/features/communities/hooks/usePosts";
import { PostCard } from "@/features/communities/components/PostCard";
import { CreatePostComposer } from "@/features/communities/components/CreatePostComposer";
import { ChallengesSection } from "@/features/communities/components/ChallengesSection";
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
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const isMember = !!community.viewerRole;
  const canManage = community.viewerRole === "owner" || community.viewerRole === "moderator";

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
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="space-y-3">
        <div className="flex h-32 items-center justify-center rounded-2xl bg-gradient-to-br from-muted to-secondary">
          <HugeiconsIcon icon={UserGroupIcon} strokeWidth={1.5} className="size-10 text-muted-foreground" />
        </div>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="font-heading text-xl font-semibold">{community.name}</h1>
            {community.description && <p className="text-sm text-muted-foreground">{community.description}</p>}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-xs text-muted-foreground">{community.memberCount ?? 0} members</span>
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
      </div>

      <Tabs defaultValue="feed">
        <TabsList>
          <TabsTrigger value="feed">Feed</TabsTrigger>
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
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
              <Avatar>
                <AvatarImage src={member.avatarUrl ?? undefined} alt={member.firstName} />
                <AvatarFallback>
                  {member.firstName[0]}
                  {member.lastName[0]}
                </AvatarFallback>
              </Avatar>
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
  );
}
