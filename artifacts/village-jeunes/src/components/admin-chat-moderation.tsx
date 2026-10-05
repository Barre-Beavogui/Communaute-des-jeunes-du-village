import { MessageCircle, Mic2, Trash2 } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getListModerationChatMessagesQueryKey,
  useDeleteModerationChatMessage,
  useListModerationChatMessages,
} from "@workspace/api-client-react";

function formatMessageDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function AdminChatModeration() {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const messagesQuery = useListModerationChatMessages({
    query: {
      retry: false,
      refetchInterval: 30_000,
      queryKey: getListModerationChatMessagesQueryKey(),
    },
  });
  const deleteMessage = useDeleteModerationChatMessage();
  const messages = messagesQuery.data ?? [];

  const remove = (id: string) => {
    if (!window.confirm("Supprimer définitivement ce message du groupe ?")) {
      return;
    }
    setDeletingId(id);
    setError("");
    deleteMessage.mutate(
      { id },
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries({
            queryKey: getListModerationChatMessagesQueryKey(),
          });
        },
        onError: () =>
          setError(
            "Le message n’a pas pu être supprimé. Reconnectez-vous puis réessayez.",
          ),
        onSettled: () => setDeletingId(null),
      },
    );
  };

  return (
    <section className="vj-enter overflow-hidden rounded-[28px] border border-border bg-card shadow-sm">
      <div className="flex items-center gap-3 border-b border-border p-5 sm:p-6">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
          <MessageCircle className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-extrabold tracking-[-.03em]">
            Modération du groupe
          </h2>
          <p className="text-xs text-muted-foreground">
            Les {messages.length} messages les plus récents
          </p>
        </div>
      </div>

      {error && (
        <p className="m-5 rounded-xl bg-destructive/10 px-4 py-3 text-xs font-semibold text-destructive sm:m-6">
          {error}
        </p>
      )}

      <div className="max-h-[34rem] divide-y divide-border overflow-y-auto">
        {messagesQuery.isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">
            Chargement des messages…
          </p>
        ) : messagesQuery.isError ? (
          <p className="p-6 text-sm text-destructive">
            Les messages ne peuvent pas être chargés pour le moment.
          </p>
        ) : messages.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">
            Aucun message dans le groupe.
          </p>
        ) : (
          messages.map((message) => (
            <article
              key={message.id}
              className="flex items-start gap-3 p-5 sm:p-6"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-muted text-xs font-extrabold text-primary">
                {message.avatarUrl ? (
                  <img
                    src={message.avatarUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  message.initials
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p className="text-xs font-extrabold">{message.memberName}</p>
                  <time className="text-[10px] text-muted-foreground">
                    {formatMessageDate(message.createdAt)}
                  </time>
                </div>
                {message.type === "audio" && message.audioData ? (
                  <div className="mt-2 flex items-center gap-2">
                    <Mic2 className="h-4 w-4 shrink-0 text-primary" />
                    <audio
                      controls
                      preload="none"
                      src={message.audioData}
                      className="h-9 max-w-full"
                    >
                      Votre navigateur ne peut pas lire ce message vocal.
                    </audio>
                  </div>
                ) : (
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">
                    {message.content}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => remove(message.id)}
                disabled={deletingId === message.id}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border text-muted-foreground hover:border-destructive hover:text-destructive disabled:opacity-50"
                aria-label={`Supprimer le message de ${message.memberName}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
