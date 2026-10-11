import { ArrowRight, LockKeyhole, Search, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import {
  getListModerationDirectMessagesQueryKey,
  useListModerationDirectMessages,
} from "@workspace/api-client-react";

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function messageDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function AdminDirectMessages() {
  const [search, setSearch] = useState("");
  const messagesQuery = useListModerationDirectMessages({
    query: {
      retry: false,
      refetchInterval: 30_000,
      queryKey: getListModerationDirectMessagesQueryKey(),
    },
  });
  const messages = messagesQuery.data ?? [];
  const visibleMessages = useMemo(() => {
    const term = normalize(search.trim());
    if (!term) return messages;
    return messages.filter((message) =>
      normalize(
        `${message.senderName} ${message.recipientName} ${message.content}`,
      ).includes(term),
    );
  }, [messages, search]);

  return (
    <section className="vj-enter overflow-hidden rounded-[28px] border border-border bg-card shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
            <LockKeyhole className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-extrabold tracking-[-.03em]">
              Messages privés
            </h2>
            <p className="text-xs text-muted-foreground">
              {messages.length} échange{messages.length > 1 ? "s" : ""} récent
              {messages.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <label className="relative block w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nom ou contenu…"
            className="field mt-0 pl-10"
          />
        </label>
      </div>
      <p className="flex items-start gap-2 border-b border-primary/10 bg-primary/5 px-5 py-3 text-[10px] font-semibold leading-5 text-muted-foreground sm:px-6">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
        Cet accès administratif doit être utilisé uniquement pour la modération,
        la sécurité et le traitement d’un signalement.
      </p>

      <div className="max-h-[34rem] divide-y divide-border overflow-y-auto">
        {messagesQuery.isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">
            Chargement des messages privés…
          </p>
        ) : messagesQuery.isError ? (
          <p className="p-6 text-sm text-destructive">
            Les messages privés ne peuvent pas être chargés.
          </p>
        ) : visibleMessages.length ? (
          visibleMessages.map((message) => (
            <article key={message.id} className="p-5 sm:px-6">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-extrabold">{message.senderName}</span>
                <ArrowRight className="h-3.5 w-3.5 text-primary" />
                <span className="font-extrabold">{message.recipientName}</span>
                <time className="ml-auto text-[9px] text-muted-foreground">
                  {messageDate(message.createdAt)}
                </time>
              </div>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">
                {message.content}
              </p>
            </article>
          ))
        ) : (
          <p className="p-6 text-sm text-muted-foreground">
            {messages.length
              ? "Aucun message ne correspond à la recherche."
              : "Aucun message privé pour le moment."}
          </p>
        )}
      </div>
    </section>
  );
}
