import { useState } from "react";
import { useForm } from "react-hook-form";
import { formatDistanceToNowStrict } from "date-fns";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ChatIcon,
  PinIcon,
  MoreHorizontalIcon,
  Delete02Icon,
  PinOffIcon,
} from "@hugeicons/core-free-icons";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { getApiErrorMessage } from "@/lib/http/apiClient";
import { ReactionPicker, REACTION_META } from "./ReactionPicker";
import { PollCard } from "./PollCard";
import {
  useReactToPost,
  useRemoveReaction,
  usePinPost,
  useDeletePost,
  useComments,
  useCreateComment,
} from "../hooks/usePosts";
import type { Post, ReactionType } from "../api/posts";

function initials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

function CommentsSection({ postId }: { postId: string }) {
  const { data: comments, isPending } = useComments(postId);
  const createComment = useCreateComment(postId);
  const { register, handleSubmit, reset } = useForm<{ body: string }>();

  const onSubmit = async (values: { body: string }) => {
    if (!values.body.trim()) return;
    try {
      await createComment.mutateAsync(values.body);
      reset();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-3 border-t border-border pt-3">
      {isPending ? (
        <p className="text-xs text-muted-foreground">Loading comments...</p>
      ) : (
        comments?.map((comment) => (
          <div key={comment.id} className="flex items-start gap-2.5">
            <Avatar size="sm">
              <AvatarImage src={comment.author.avatarUrl ?? undefined} alt={comment.author.firstName} />
              <AvatarFallback>{initials(comment.author.firstName, comment.author.lastName)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 rounded-xl bg-muted px-3 py-2">
              <p className="text-xs font-medium">
                {comment.author.firstName} {comment.author.lastName}
              </p>
              <p className="text-sm text-foreground/90">{comment.body}</p>
            </div>
          </div>
        ))
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="flex items-center gap-2">
        <Textarea
          rows={1}
          placeholder="Write a comment..."
          className="min-h-9 resize-none py-2"
          {...register("body")}
        />
        <Button size="sm" type="submit" disabled={createComment.isPending}>
          Send
        </Button>
      </form>
    </div>
  );
}

export function PostCard({ post, canManage }: { post: Post; canManage: boolean }) {
  const [showComments, setShowComments] = useState(false);
  const react = useReactToPost();
  const removeReaction = useRemoveReaction();
  const pin = usePinPost();
  const deletePost = useDeletePost();

  const handleReaction = async (reaction: ReactionType) => {
    try {
      if (post.viewerReaction === reaction) {
        await removeReaction.mutateAsync(post.id);
      } else {
        await react.mutateAsync({ postId: post.id, reactionType: reaction });
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    try {
      await deletePost.mutateAsync(post.id);
      toast.success("Post deleted");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Avatar>
              <AvatarImage src={post.author.avatarUrl ?? undefined} alt={post.author.firstName} />
              <AvatarFallback>{initials(post.author.firstName, post.author.lastName)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">
                {post.author.firstName} {post.author.lastName}
              </p>
              <p className="text-xs text-muted-foreground">{formatDistanceToNowStrict(new Date(post.createdAt), { addSuffix: true })}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {post.isPinned && (
              <Badge variant="secondary" className="gap-1">
                <HugeiconsIcon icon={PinIcon} strokeWidth={2} className="size-3" /> Pinned
              </Badge>
            )}
            {canManage && (
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                  <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => pin.mutate({ postId: post.id, pinned: !post.isPinned })}>
                    <HugeiconsIcon icon={post.isPinned ? PinOffIcon : PinIcon} strokeWidth={2} />
                    {post.isPinned ? "Unpin" : "Pin post"}
                  </DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onClick={handleDelete}>
                    <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        <p className="text-sm whitespace-pre-wrap text-foreground/90">{post.body}</p>
        {post.imageUrl && <img src={post.imageUrl} alt="" className="max-h-96 w-full rounded-xl object-cover" />}

        {post.hasPoll && <PollCard postId={post.id} canManage={canManage} />}

        <div className="flex items-center gap-1 border-t border-border pt-2">
          <ReactionPicker viewerReaction={post.viewerReaction} onSelect={handleReaction} />
          <Button variant="ghost" size="sm" onClick={() => setShowComments((v) => !v)}>
            <HugeiconsIcon icon={ChatIcon} strokeWidth={2} className="size-4" />
            {post.commentCount > 0 ? post.commentCount : "Comment"}
          </Button>
          {post.reactionCount > 0 && (
            <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
              {post.viewerReaction && (
                <HugeiconsIcon icon={REACTION_META[post.viewerReaction].icon} strokeWidth={2} className="size-3.5 text-ai-accent" />
              )}
              {post.reactionCount}
            </span>
          )}
        </div>

        {showComments && <CommentsSection postId={post.id} />}
      </CardContent>
    </Card>
  );
}
