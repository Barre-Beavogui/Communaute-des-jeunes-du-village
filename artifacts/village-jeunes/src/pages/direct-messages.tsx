import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  MessageCircle,
  Search,
  Send,
} from "lucide-react";
import { Link, useParams } from "wouter";
import {
  getGetDirectMessageThreadQueryKey,
  getGetDirectMessageUnreadCountQueryKey,
  getListDirectMessageConversationsQueryKey,
  getListProfilesQueryKey,
  useGetDirectMessageThread,
  useListDirectMessageConversations,
  useListProfiles,
  useMarkDirectMessageRead,
  useSendDirectMessage,
} from "@workspace/api-client-react";
import { Avatar } from "@/components/village-shell";
import { getMemberIdentity } from "@/lib/member-session";

function messageTime(value: string) {
  const date = new Date(value);
  const sameDay = date.toDateString() === new Date().toDateString();
  return new Intl.DateTimeFormat("fr-FR", {
    ...(sameDay ? {} : { day: "numeric", month: "short" }),
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export default function DirectMessagesPage() {
  const params = useParams<{ profileId?: string }>();
  const selectedId = params.profileId ?? "";
  const member = getMemberIdentity();
  const queryClient = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const profilesQuery = useListProfiles({
    query: {
      queryKey: getListProfilesQueryKey(),
      refetchOnWindowFocus: true,
    },
  });
  const conversationsQuery = useListDirectMessageConversations({
    query: {
      queryKey: getListDirectMessageConversationsQueryKey(),
      refetchInterval: 10_000,
      refetchOnWindowFocus: true,
    },
  });
  const threadQuery = useGetDirectMessageThread(selectedId, {
    query: {
      enabled: Boolean(selectedId),
      queryKey: getGetDirectMessageThreadQueryKey(selectedId),
      refetchInterval: 6_000,
      refetchOnWindowFocus: true,
    },
  });
  const sendMessage = useSendDirectMessage();
  const markRead = useMarkDirectMessageRead();
  const profiles = profilesQuery.data ?? [];
  const conversations = conversationsQuery.data ?? [];
  const messages = threadQuery.data ?? [];
  const selectedProfile = profiles.find((profile) => profile.id === selectedId);
  const conversationByProfile = useMemo(
    () => new Map(conversations.map((item) => [item.profileId, item])),
    [conversations],
  );
  const visibleProfiles = useMemo(() => {
    const term = normalize(search.trim());
    return profiles
      .filter(
        (profile) =>
          profile.id !== member?.id &&
          (!term ||
            normalize(`${profile.name} ${profile.neighborhood}`).includes(
              term,
            )),
      )
      .sort((left, right) => {
        const leftConversation = conversationByProfile.get(left.id);
        const rightConversation = conversationByProfile.get(right.id);
        if (leftConversation && rightConversation) {
          return (
            new Date(rightConversation.lastMessageAt).getTime() -
            new Date(leftConversation.lastMessageAt).getTime()
          );
        }
        if (leftConversation) return -1;
        if (rightConversation) return 1;
        return left.name.localeCompare(right.name, "fr");
      });
  }, [conversationByProfile, member?.id, profiles, search]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, selectedId]);

  useEffect(() => {
    if (!selectedId || !messages.length || markRead.isPending) return;
    markRead.mutate(
      { profileId: selectedId },
      {
        onSuccess: async () => {
          await Promise.all([
            queryClient.invalidateQueries({
              queryKey: getListDirectMessageConversationsQueryKey(),
            }),
            queryClient.invalidateQueries({
              queryKey: getGetDirectMessageUnreadCountQueryKey(),
            }),
          ]);
        },
      },
    );
  }, [messages.length, selectedId]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const message = content.trim();
    if (!selectedId || !message || sendMessage.isPending) return;
    setError("");
    sendMessage.mutate(
      { profileId: selectedId, data: { content: message } },
      {
        onSuccess: async () => {
          setContent("");
          await Promise.all([
            queryClient.invalidateQueries({
              queryKey: getGetDirectMessageThreadQueryKey(selectedId),
            }),
            queryClient.invalidateQueries({
              queryKey: getListDirectMessageConversationsQueryKey(),
            }),
          ]);
        },
        onError: () => setError("Le message n’a pas pu être envoyé."),
      },
    );
  };

  return (
    <div className="vj-enter overflow-hidden rounded-[28px] border border-border bg-card shadow-sm">
      <div className="grid min-h-[calc(100dvh-11rem)] md:grid-cols-[320px_1fr]">
        <aside
          className={`border-border md:border-r ${selectedId ? "hidden md:block" : "block"}`}
        >
          <div className="border-b border-border p-5">
            <p className="font-mono text-[9px] font-bold uppercase tracking-[.18em] text-primary">
              Discussions privées
            </p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-[-.04em]">
              Messages
            </h1>
            <label className="relative mt-4 block">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher un membre"
                className="field mt-0 pl-10"
              />
            </label>
          </div>
          <div className="max-h-[calc(100dvh-19rem)] overflow-y-auto p-2.5">
            {profilesQuery.isLoading ? (
              <p className="p-4 text-xs text-muted-foreground">Chargement…</p>
            ) : visibleProfiles.length ? (
              visibleProfiles.map((profile) => {
                const conversation = conversationByProfile.get(profile.id);
                return (
                  <Link
                    key={profile.id}
                    href={`/messages/${profile.id}`}
                    className="flex items-center gap-3 rounded-2xl p-3 transition hover:bg-muted/70"
                  >
                    <Avatar profile={profile} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-extrabold">
                        {profile.name}
                      </span>
                      <span className="mt-1 block truncate text-[10px] text-muted-foreground">
                        {conversation?.lastMessage || profile.neighborhood}
                      </span>
                    </span>
                    {Boolean(conversation?.unreadCount) && (
                      <span className="grid min-w-5 place-items-center rounded-full bg-primary px-1.5 py-1 text-[8px] font-extrabold text-primary-foreground">
                        {conversation!.unreadCount}
                      </span>
                    )}
                  </Link>
                );
              })
            ) : (
              <p className="p-4 text-xs text-muted-foreground">
                Aucun membre trouvé.
              </p>
            )}
          </div>
        </aside>

        <section
          className={`${selectedId ? "flex" : "hidden md:flex"} min-w-0 flex-col`}
        >
          {selectedProfile ? (
            <>
              <header className="flex items-center gap-3 border-b border-border px-4 py-3.5 sm:px-5">
                <Link
                  href="/messages"
                  className="grid h-9 w-9 place-items-center rounded-full border border-border md:hidden"
                  aria-label="Retour aux conversations"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Link>
                <Avatar profile={selectedProfile} size="sm" />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-sm font-extrabold">
                    {selectedProfile.name}
                  </h2>
                  <p className="text-[10px] text-muted-foreground">
                    Conversation individuelle
                  </p>
                </div>
              </header>

              <div className="flex-1 space-y-3 overflow-y-auto bg-muted/20 p-4 sm:p-6">
                {threadQuery.isLoading ? (
                  <p className="py-10 text-center text-xs text-muted-foreground">
                    Chargement de la conversation…
                  </p>
                ) : messages.length ? (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.mine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-[20px] px-4 py-3 text-sm leading-6 shadow-sm sm:max-w-[70%] ${message.mine ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md border border-border bg-card"}`}
                      >
                        <p className="whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                        <time
                          className={`mt-1.5 block text-right text-[9px] ${message.mine ? "text-primary-foreground/65" : "text-muted-foreground"}`}
                        >
                          {messageTime(message.createdAt)}
                        </time>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="grid min-h-60 place-items-center text-center">
                    <div>
                      <MessageCircle className="mx-auto h-8 w-8 text-primary" />
                      <p className="mt-3 text-sm font-extrabold">
                        Commencez la conversation
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Envoyez un premier message à {selectedProfile.name}.
                      </p>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              <form
                onSubmit={submit}
                className="border-t border-border p-3 sm:p-4"
              >
                {error && (
                  <p className="mb-2 text-xs font-semibold text-destructive">
                    {error}
                  </p>
                )}
                <div className="flex items-end gap-2">
                  <textarea
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    rows={1}
                    maxLength={2000}
                    placeholder="Écrire un message…"
                    className="field mt-0 min-h-12 flex-1 resize-none py-3"
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        event.currentTarget.form?.requestSubmit();
                      }
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!content.trim() || sendMessage.isPending}
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground disabled:opacity-45"
                    aria-label="Envoyer le message"
                  >
                    <Send className="h-4.5 w-4.5" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="grid flex-1 place-items-center px-6 text-center">
              <div>
                <MessageCircle className="mx-auto h-10 w-10 text-primary" />
                <h2 className="mt-4 text-xl font-extrabold">
                  Choisissez un membre
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Sélectionnez une personne pour commencer une discussion.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
