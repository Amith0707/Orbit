import { useNavigate } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { User02Icon, UserGroupIcon, Shield02Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminUsers, useAdminCommunities, useAdminModerationPosts } from "@/features/admin/hooks/useAdmin";

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { data: usersData, isPending: usersPending } = useAdminUsers({ limit: 1 });
  const { data: communitiesData, isPending: communitiesPending } = useAdminCommunities({ limit: 1 });
  const { data: moderationData, isPending: moderationPending } = useAdminModerationPosts({ limit: 5 });

  const stats = [
    {
      label: "Total employees",
      value: usersData?.total,
      isPending: usersPending,
      icon: User02Icon,
      onClick: () => navigate("/admin/users"),
    },
    {
      label: "Communities",
      value: communitiesData?.total,
      isPending: communitiesPending,
      icon: UserGroupIcon,
      onClick: () => navigate("/admin/communities"),
    },
    {
      label: "Posts pending review",
      value: moderationData?.total,
      isPending: moderationPending,
      icon: Shield02Icon,
      onClick: () => navigate("/admin/moderation"),
    },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="font-heading text-xl font-semibold">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">Manage users, communities, and moderate content across Calfus Orbit.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="cursor-pointer transition-shadow hover:shadow-md" onClick={stat.onClick}>
            <CardContent className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <HugeiconsIcon icon={stat.icon} strokeWidth={1.5} className="size-5" />
              </div>
              <div>
                {stat.isPending ? (
                  <Skeleton className="h-7 w-10" />
                ) : (
                  <p className="font-heading text-2xl font-semibold">{stat.value ?? 0}</p>
                )}
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent posts flagged for review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {moderationPending ? (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
            </div>
          ) : !moderationData || moderationData.posts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent posts to review.</p>
          ) : (
            moderationData.posts.map((post) => (
              <div key={post.id} className="flex items-start justify-between gap-3 rounded-xl border border-border p-3">
                <div className="min-w-0 space-y-0.5">
                  <p className="text-xs text-muted-foreground">
                    {post.author.firstName} {post.author.lastName} · {post.communityName}
                  </p>
                  <p className="line-clamp-1 text-sm">{post.body}</p>
                </div>
              </div>
            ))
          )}
          <button
            onClick={() => navigate("/admin/moderation")}
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            View all <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-3.5" />
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
