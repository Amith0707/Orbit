import { formatDistanceToNowStrict } from "date-fns";
import { useNavigate } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Notification02Icon,
  SparklesIcon,
  Calendar01Icon,
  ChatIcon,
  UserGroupIcon,
  Award02Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { EmptyState } from "@/components/composite/EmptyState";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/features/notifications/hooks/useNotifications";
import type { NotificationItem, NotificationType } from "@/features/notifications/api/notifications";
import { cn } from "@/lib/utils";

const ICONS_BY_TYPE: Record<NotificationType, typeof Notification02Icon> = {
  post_reaction: ChatIcon,
  post_comment: ChatIcon,
  event_reminder: Calendar01Icon,
  event_rsvp: Calendar01Icon,
  community_invite: UserGroupIcon,
  poll_new: ChatIcon,
  poll_closed: ChatIcon,
  match_suggestion: SparklesIcon,
  digest_ready: SparklesIcon,
  mention: Award02Icon,
  challenge_new: Award02Icon,
};

function NotificationRow({ notification, onOpen }: { notification: NotificationItem; onOpen: (n: NotificationItem) => void }) {
  const Icon = ICONS_BY_TYPE[notification.type] ?? Notification02Icon;
  const isAi = notification.type === "match_suggestion" || notification.type === "digest_ready";

  return (
    <button
      type="button"
      onClick={() => onOpen(notification)}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-muted",
        !notification.isRead && "bg-accent/40"
      )}
    >
      <div
        className={cn(
          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
          isAi ? "bg-ai-accent-soft text-ai-accent" : "bg-muted text-muted-foreground"
        )}
      >
        <HugeiconsIcon icon={Icon} strokeWidth={2} className="size-4" />
      </div>
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="truncate text-sm font-medium text-foreground">{notification.title}</p>
        {notification.body && <p className="line-clamp-2 text-xs text-muted-foreground">{notification.body}</p>}
        <p className="text-[11px] text-muted-foreground">
          {formatDistanceToNowStrict(new Date(notification.createdAt), { addSuffix: true })}
        </p>
      </div>
      {!notification.isRead && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-ai-accent" />}
    </button>
  );
}

export function NotificationBell() {
  const { data } = useNotifications({ limit: 8 });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const navigate = useNavigate();

  const unreadCount = data?.unreadCount ?? 0;

  const handleOpen = (notification: NotificationItem) => {
    if (!notification.isRead) markRead.mutate(notification.id);
    if (notification.linkUrl) navigate(notification.linkUrl);
  };

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label="Notifications" className="relative" />
        }
      >
        <HugeiconsIcon icon={Notification02Icon} strokeWidth={2} className="size-4" />
        {unreadCount > 0 && (
          <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 min-w-4 justify-center px-1 text-[10px]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-2">
        <div className="flex items-center justify-between px-2 pt-1 pb-2">
          <p className="font-heading text-sm font-medium">Notifications</p>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllRead.mutate()}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Mark all read
            </button>
          )}
        </div>
        {!data || data.notifications.length === 0 ? (
          <EmptyState
            icon={<HugeiconsIcon icon={Notification02Icon} strokeWidth={2} className="size-5" />}
            title="You're all caught up"
            description="New activity and AI insights will show up here."
          />
        ) : (
          <div className="flex max-h-96 flex-col gap-1 overflow-y-auto">
            {data.notifications.map((n) => (
              <NotificationRow key={n.id} notification={n} onOpen={handleOpen} />
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
