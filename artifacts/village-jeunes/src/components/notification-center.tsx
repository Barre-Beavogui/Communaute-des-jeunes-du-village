import {
  Bell,
  CalendarDays,
  CheckCheck,
  ChevronRight,
  MessageCircleMore,
  Megaphone,
  Vote,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import {
  getGetChatUnreadCountQueryKey,
  getGetDirectMessageUnreadCountQueryKey,
  getListAnnouncementsQueryKey,
  getListEventsQueryKey,
  getListPollsQueryKey,
  useGetChatUnreadCount,
  useGetDirectMessageUnreadCount,
  useListAnnouncements,
  useListEvents,
  useListPolls,
} from "@workspace/api-client-react";
import { getMemberIdentity } from "@/lib/member-session";

type NotificationItem = {
  id: string;
  href: string;
  title: string;
  detail: string;
  createdAt: string;
  icon: typeof Bell;
  unread: boolean;
  accent: string;
};

function formatNotificationDate(value: string) {
  const date = new Date(value);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return new Intl.DateTimeFormat("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
  }).format(date);
}

export function NotificationCenter({ enabled }: { enabled: boolean }) {
  const member = getMemberIdentity();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const storageKey = `zoboroma_notifications_read_${member?.id ?? "member"}`;
  const [readAt, setReadAt] = useState(() => {
    const stored = localStorage.getItem(storageKey);
    return stored ? Date.parse(stored) || 0 : 0;
  });
  const announcementsQuery = useListAnnouncements({
    query: {
      enabled,
      queryKey: getListAnnouncementsQueryKey(),
      refetchInterval: 60_000,
      refetchOnWindowFocus: true,
    },
  });
  const eventsQuery = useListEvents({
    query: {
      enabled,
      queryKey: getListEventsQueryKey(),
      refetchInterval: 60_000,
      refetchOnWindowFocus: true,
    },
  });
  const pollsQuery = useListPolls({
    query: {
      enabled,
      queryKey: getListPollsQueryKey(),
      refetchInterval: 60_000,
      refetchOnWindowFocus: true,
    },
  });
  const unreadQuery = useGetChatUnreadCount({
    query: {
      enabled,
      retry: false,
      queryKey: getGetChatUnreadCountQueryKey(),
      refetchInterval: 30_000,
      refetchOnWindowFocus: true,
    },
  });
  const directUnreadQuery = useGetDirectMessageUnreadCount({
    query: {
      enabled,
      retry: false,
      queryKey: getGetDirectMessageUnreadCountQueryKey(),
      refetchInterval: 30_000,
      refetchOnWindowFocus: true,
    },
  });

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const contentNotifications = useMemo<NotificationItem[]>(() => {
    const announcements = (announcementsQuery.data ?? [])
      .slice(0, 4)
      .map((announcement) => ({
        id: `announcement-${announcement.id}`,
        href: `/actualites#annonce-${announcement.id}`,
        title: announcement.title,
        detail: "Nouvelle publication dans la vie du village",
        createdAt: announcement.createdAt,
        icon: Megaphone,
        unread: new Date(announcement.createdAt).getTime() > readAt,
        accent: "bg-primary/10 text-primary",
      }));
    const nextEvent = (eventsQuery.data ?? []).find(
      (event) => event.status === "upcoming",
    );
    const openPoll = (pollsQuery.data ?? []).find(
      (poll) => poll.status === "open" && !poll.selectedOptionId,
    );
    const actions: NotificationItem[] = [];
    if (nextEvent) {
      actions.push({
        id: `event-${nextEvent.id}`,
        href: "/evenements",
        title: nextEvent.title,
        detail: nextEvent.memberResponse
          ? "Votre réponse est enregistrée"
          : "Confirmez votre disponibilité",
        createdAt: nextEvent.createdAt,
        icon: CalendarDays,
        unread: new Date(nextEvent.createdAt).getTime() > readAt,
        accent: "bg-secondary/10 text-secondary",
      });
    }
    if (openPoll) {
      actions.push({
        id: `poll-${openPoll.id}`,
        href: "/actualites",
        title: openPoll.question,
        detail: "Votre avis est attendu",
        createdAt: openPoll.createdAt,
        icon: Vote,
        unread: new Date(openPoll.createdAt).getTime() > readAt,
        accent: "bg-accent text-accent-foreground",
      });
    }
    return [...actions, ...announcements]
      .sort(
        (left, right) =>
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime(),
      )
      .slice(0, 6);
  }, [announcementsQuery.data, eventsQuery.data, pollsQuery.data, readAt]);

  if (!enabled) return null;

  const chatUnread = unreadQuery.data?.count ?? 0;
  const directUnread = directUnreadQuery.data?.count ?? 0;
  const contentUnread = contentNotifications.filter(
    (notification) => notification.unread,
  ).length;
  const totalUnread = chatUnread + directUnread + contentUnread;
  const messageNotifications: NotificationItem[] = [
    ...(directUnread
      ? [
          {
            id: "direct-unread",
            href: "/messages",
            title: `${directUnread} message${directUnread > 1 ? "s" : ""} privé${directUnread > 1 ? "s" : ""}`,
            detail: "Dans vos conversations individuelles",
            createdAt: new Date().toISOString(),
            icon: MessageCircleMore,
            unread: true,
            accent: "bg-primary text-primary-foreground",
          },
        ]
      : []),
    ...(chatUnread
      ? [
          {
            id: "chat-unread",
            href: "/groupe",
            title: `${chatUnread} nouveau${chatUnread > 1 ? "x" : ""} message${chatUnread > 1 ? "s" : ""}`,
            detail: "Dans le groupe de communication",
            createdAt: new Date().toISOString(),
            icon: MessageCircleMore,
            unread: true,
            accent: "bg-foreground text-background",
          },
        ]
      : []),
  ];
  const notifications: NotificationItem[] = [
    ...messageNotifications,
    ...contentNotifications,
  ];

  const markContentAsRead = () => {
    const now = new Date();
    localStorage.setItem(storageKey, now.toISOString());
    setReadAt(now.getTime());
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative grid h-10 w-10 place-items-center rounded-xl border border-border bg-card text-foreground shadow-sm transition hover:border-primary/30 hover:text-primary"
        aria-label={`Notifications${totalUnread ? `, ${totalUnread} non lue${totalUnread > 1 ? "s" : ""}` : ""}`}
        aria-expanded={open}
        data-testid="button-notifications"
      >
        <Bell className="h-[18px] w-[18px]" />
        {totalUnread > 0 && (
          <span className="absolute -right-1.5 -top-1.5 grid min-h-5 min-w-5 place-items-center rounded-full border-2 border-background bg-primary px-1 text-[8px] font-extrabold text-primary-foreground">
            {totalUnread > 99 ? "99+" : totalUnread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed left-3 right-3 top-[72px] z-[80] overflow-hidden rounded-[24px] border border-border bg-card shadow-2xl sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-[390px]">
          <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
            <div>
              <p className="font-mono text-[9px] font-bold uppercase tracking-[.18em] text-primary">
                Centre d’activité
              </p>
              <h2 className="mt-1 text-base font-extrabold">Notifications</h2>
            </div>
            {contentUnread > 0 && (
              <button
                type="button"
                onClick={markContentAsRead}
                className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-2 text-[9px] font-extrabold text-muted-foreground hover:text-foreground"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Tout lire
              </button>
            )}
          </div>

          <div className="max-h-[min(68vh,520px)] overflow-y-auto p-2.5">
            {notifications.length ? (
              notifications.map((notification) => {
                const Icon = notification.icon;
                return (
                  <Link
                    key={notification.id}
                    href={notification.href}
                    onClick={() => setOpen(false)}
                    className={`group flex items-center gap-3 rounded-2xl p-3 transition hover:bg-muted/70 ${notification.unread ? "bg-primary/[.045]" : ""}`}
                  >
                    <span
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${notification.accent}`}
                    >
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-xs font-extrabold">
                          {notification.title}
                        </span>
                        {notification.unread && (
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        )}
                      </span>
                      <span className="mt-1 block truncate text-[10px] font-semibold text-muted-foreground">
                        {notification.detail} ·{" "}
                        {formatNotificationDate(notification.createdAt)}
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                  </Link>
                );
              })
            ) : (
              <div className="px-5 py-10 text-center">
                <CheckCheck className="mx-auto h-7 w-7 text-secondary" />
                <p className="mt-3 text-sm font-extrabold">Tout est à jour</p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Les prochaines nouvelles apparaîtront ici.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
