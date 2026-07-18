import { useParams } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { usePost } from "@/features/communities/hooks/usePosts";
import { PostCard } from "@/features/communities/components/PostCard";

export default function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>();
  const { data: post, isPending } = usePost(postId ?? "");

  if (isPending || !post) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <Skeleton className="h-56 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <PostCard post={post} canManage={false} />
    </div>
  );
}
