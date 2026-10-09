import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  type CommunityEvent,
  getListEventsQueryKey,
  useListEvents,
  useRespondToEvent,
} from "@workspace/api-client-react";
import {
  BellRing,
  CalendarDays,
  Check,
  Clock3,
  FileText,
  MapPin,
  UsersRound,
  X,
} from "lucide-react";

function eventDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function relativeReminder(value: string) {
  const difference = new Date(value).getTime() - Date.now();
  const hours = Math.max(1, Math.ceil(difference / 3_600_000));
  if (hours < 24) return `dans ${hours} h`;
  const days = Math.ceil(hours / 24);
  return `dans ${days} jour${days > 1 ? "s" : ""}`;
}

function EventCard({ event }: { event: CommunityEvent }) {
  const queryClient = useQueryClient();
  const respond = useRespondToEvent();
  const [error, setError] = useState("");
  const isUpcoming = event.status === "upcoming";

  const choose = (response: "attending" | "unavailable") => {
    setError("");
    respond.mutate(
      { id: event.id, data: { response } },
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries({
            queryKey: getListEventsQueryKey(),
          });
        },
        onError: () => setError("Votre réponse n’a pas pu être enregistrée."),
      },
    );
  };

  return (
    <article className="overflow-hidden rounded-[26px] border border-border bg-card shadow-sm">
      <div className="p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[.18em] text-primary">
              {event.status === "cancelled"
                ? "Événement annulé"
                : event.status === "completed"
                  ? "Réunion terminée"
                  : "Prochaine rencontre"}
            </p>
            <h2 className="mt-2 text-xl font-extrabold tracking-[-.03em] sm:text-2xl">
              {event.title}
            </h2>
          </div>
          {isUpcoming && (
            <span className="rounded-full bg-primary/10 px-3 py-1.5 text-[10px] font-extrabold text-primary">
              {event.attendingCount} participant
              {event.attendingCount > 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
          <p className="flex items-start gap-2.5 font-semibold">
            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span className="capitalize">{eventDate(event.startsAt)}</span>
          </p>
          <p className="flex items-start gap-2.5 font-semibold">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            {event.location}
          </p>
        </div>

        <div className="mt-5 rounded-2xl bg-muted/60 p-4">
          <p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-muted-foreground">
            Ordre du jour
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
            {event.agenda}
          </p>
        </div>

        {isUpcoming && (
          <div className="mt-5">
            <p className="mb-3 text-xs font-extrabold">Votre disponibilité</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => choose("attending")}
                disabled={respond.isPending}
                className={`flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-xs font-extrabold transition-colors ${
                  event.memberResponse === "attending"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-card hover:border-primary hover:text-primary"
                }`}
              >
                <Check className="h-4 w-4" /> Je participe
              </button>
              <button
                type="button"
                onClick={() => choose("unavailable")}
                disabled={respond.isPending}
                className={`flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-xs font-extrabold transition-colors ${
                  event.memberResponse === "unavailable"
                    ? "bg-foreground text-background"
                    : "border border-border bg-card hover:border-foreground"
                }`}
              >
                <X className="h-4 w-4" /> Je ne suis pas disponible
              </button>
            </div>
            <p className="mt-3 text-[10px] text-muted-foreground">
              {event.unavailableCount} indisponible
              {event.unavailableCount > 1 ? "s" : ""}
            </p>
          </div>
        )}

        {error && (
          <p className="mt-4 text-xs font-semibold text-destructive">{error}</p>
        )}
      </div>

      {(event.reportContent || event.reportUrl) && (
        <div className="border-t border-border bg-accent/15 p-5 sm:p-7">
          <div className="flex items-center gap-2 text-primary">
            <FileText className="h-5 w-5" />
            <h3 className="text-sm font-extrabold">
              {event.reportTitle || "Compte rendu"}
            </h3>
          </div>
          {event.reportContent && (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-foreground/80">
              {event.reportContent}
            </p>
          )}
          {event.reportUrl && (
            <a
              href={event.reportUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-xs font-extrabold text-background"
            >
              <FileText className="h-4 w-4" /> Consulter le document
            </a>
          )}
        </div>
      )}
    </article>
  );
}

export default function EventsPage() {
  const eventsQuery = useListEvents({
    query: { queryKey: getListEventsQueryKey(), refetchInterval: 60_000 },
  });
  const events = eventsQuery.data ?? [];
  const upcoming = events.filter((event) => event.status === "upcoming");
  const archives = events.filter((event) => event.status !== "upcoming");
  const reminder = useMemo(
    () =>
      upcoming.find((event) => {
        const difference = new Date(event.startsAt).getTime() - Date.now();
        return difference > 0 && difference <= 7 * 24 * 60 * 60 * 1000;
      }),
    [upcoming],
  );

  return (
    <div className="vj-enter mx-auto max-w-5xl">
      <header className="rounded-[30px] bg-foreground px-6 py-8 text-background sm:px-9 sm:py-10">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[.2em] text-accent">
          Agenda communautaire
        </p>
        <h1 className="vj-display mt-3 text-5xl leading-[.92] sm:text-7xl">
          Réunions et événements.
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-background/65">
          Retrouvez les dates, les lieux, les ordres du jour et confirmez votre
          présence.
        </p>
      </header>

      {reminder && (
        <div className="mt-5 flex items-start gap-3 rounded-[22px] border border-accent/50 bg-accent/25 p-4 sm:p-5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
            <BellRing className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.12em]">
              Rappel automatique
            </p>
            <p className="mt-1 text-sm leading-6">
              <strong>{reminder.title}</strong> commence{" "}
              {relativeReminder(reminder.startsAt)}.
            </p>
          </div>
        </div>
      )}

      <section className="mt-7 space-y-5">
        {eventsQuery.isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2">
            {[1, 2].map((item) => (
              <div
                key={item}
                className="h-72 animate-pulse rounded-[26px] bg-muted"
              />
            ))}
          </div>
        ) : eventsQuery.isError ? (
          <p className="rounded-2xl bg-destructive/10 p-5 text-sm text-destructive">
            L’agenda est temporairement indisponible.
          </p>
        ) : upcoming.length ? (
          upcoming.map((event) => <EventCard key={event.id} event={event} />)
        ) : (
          <div className="rounded-[26px] border border-dashed border-border bg-card p-10 text-center">
            <CalendarDays className="mx-auto h-9 w-9 text-primary" />
            <p className="mt-4 text-sm font-extrabold">
              Aucune rencontre programmée
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Le prochain rendez-vous sera affiché ici.
            </p>
          </div>
        )}
      </section>

      {archives.length > 0 && (
        <section className="mt-10">
          <div className="mb-4 flex items-center gap-3">
            <Clock3 className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-extrabold tracking-[-.03em]">
              Rencontres précédentes
            </h2>
          </div>
          <div className="space-y-5">
            {archives.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

      <div className="mt-8 flex items-center gap-2 text-[10px] font-semibold text-muted-foreground">
        <UsersRound className="h-4 w-4" /> Les réponses sont réservées aux
        membres connectés.
      </div>
    </div>
  );
}
