import { useNavigate } from "react-router-dom";
import { formatDistanceToNowStrict } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import { Notification02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/composite/EmptyState";
import { cn } from "@/lib/utils";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/features/notifications/hooks/useNotifications";
import type { NotificationItem } from "@/features/notifications/api/notifications";

export default function NotificationsPage() {
  const { data, isPending } = useNotifications({ limit: 50 });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const navigate = useNavigate();

  const handleOpen = (n: NotificationItem) => {
    if (!n.isRead) markRead.mutate(n.id);
    if (n.linkUrl) navigate(n.linkUrl);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-xl font-semibold">Notifications</h1>
        {data && data.unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()}>
            Mark all read
          </Button>
        )}
      </div>

      {isPending ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : !data || data.notifications.length === 0 ? (
        <EmptyState
          icon={<HugeiconsIcon icon={Notification02Icon} strokeWidth={2} className="size-5" />}
          title="You're all caught up"
          description="New activity and AI insights will show up here."
        />
      ) : (
        <div className="space-y-1.5">
          {data.notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => handleOpen(n)}
              className={cn(
                "flex w-full flex-col gap-1 rounded-xl border border-border p-4 text-left transition-colors hover:bg-muted",
                !n.isRead && "bg-accent/40"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{n.title}</p>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatDistanceToNowStrict(new Date(n.createdAt), { addSuffix: true })}
                </span>
              </div>
              {n.body && <p className="text-sm text-muted-foreground">{n.body}</p>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
