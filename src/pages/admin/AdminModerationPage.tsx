import { toast } from "sonner";
import { formatDistanceToNowStrict } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import { Shield02Icon, Delete02Icon, Comment01Icon, ThumbsUpIcon, PinIcon } from "@hugeicons/core-free-icons";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/composite/EmptyState";
import { getApiErrorMessage } from "@/lib/http/apiClient";
import { useAdminModerationPosts, useDeleteModerationPost } from "@/features/admin/hooks/useAdmin";

export default function AdminModerationPage() {
  const { data, isPending } = useAdminModerationPosts({ limit: 50 });
  const deletePost = useDeleteModerationPost();

  const handleDelete = async (postId: string) => {
    try {
      await deletePost.mutateAsync(postId);
      toast.success("Post removed");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="font-heading text-xl font-semibold">Moderation</h1>
        <p className="text-sm text-muted-foreground">Review recent posts across all communities and remove anything that violates guidelines.</p>
      </div>

      {isPending ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      ) : !data || data.posts.length === 0 ? (
        <EmptyState
          icon={<HugeiconsIcon icon={Shield02Icon} strokeWidth={2} className="size-5" />}
          title="Nothing to review"
          description="No recent posts need moderation."
        />
      ) : (
        <div className="space-y-4">
          {data.posts.map((post) => (
            <Card key={post.id}>
              <CardContent className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar size="sm">
                      <AvatarImage src={post.author.avatarUrl ?? undefined} alt={post.author.firstName} />
                      <AvatarFallback>
                        {post.author.firstName[0]}
                        {post.author.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {post.author.firstName} {post.author.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {post.communityName} · {formatDistanceToNowStrict(new Date(post.createdAt))} ago
                      </p>
                    </div>
                  </div>
                  {post.isPinned && (
                    <Badge variant="outline" className="gap-1">
                      <HugeiconsIcon icon={PinIcon} strokeWidth={2} className="size-3" /> Pinned
                    </Badge>
                  )}
                </div>

                <p className="text-sm whitespace-pre-wrap">{post.body}</p>
                {post.imageUrl && <img src={post.imageUrl} alt="" className="max-h-64 w-full rounded-xl object-cover" />}

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <HugeiconsIcon icon={ThumbsUpIcon} strokeWidth={2} className="size-3.5" /> {post.reactionCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <HugeiconsIcon icon={Comment01Icon} strokeWidth={2} className="size-3.5" /> {post.commentCount}
                    </span>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger render={<Button variant="outline" size="sm" />}>
                      <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} /> Remove
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove this post?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This permanently removes the post from {post.communityName}. This can't be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => handleDelete(post.id)}
                        >
                          Remove post
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
