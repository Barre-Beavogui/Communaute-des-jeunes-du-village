import { type FormEvent, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  type CommunityEvent,
  getListModerationEventsQueryKey,
  useCreateEvent,
  useDeleteEvent,
  useListModerationEvents,
  useUpdateEvent,
} from "@workspace/api-client-react";
import {
  CalendarDays,
  FileText,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";

type FormState = {
  title: string;
  startsAt: string;
  location: string;
  agenda: string;
  status: "upcoming" | "completed" | "cancelled";
  reportTitle: string;
  reportContent: string;
  reportUrl: string;
};

const emptyForm: FormState = {
  title: "",
  startsAt: "",
  location: "",
  agenda: "",
  status: "upcoming",
  reportTitle: "",
  reportContent: "",
  reportUrl: "",
};

function toLocalInput(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function displayDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function AdminEvents() {
  const queryClient = useQueryClient();
  const eventsQuery = useListModerationEvents({
    query: { retry: false, queryKey: getListModerationEventsQueryKey() },
  });
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const events = eventsQuery.data ?? [];

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const close = () => {
    setOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  };

  const edit = (event: CommunityEvent) => {
    setEditingId(event.id);
    setForm({
      title: event.title,
      startsAt: toLocalInput(event.startsAt),
      location: event.location,
      agenda: event.agenda,
      status: event.status,
      reportTitle: event.reportTitle ?? "",
      reportContent: event.reportContent ?? "",
      reportUrl: event.reportUrl ?? "",
    });
    setOpen(true);
    setError("");
  };

  const refresh = async () => {
    await queryClient.invalidateQueries({
      queryKey: getListModerationEventsQueryKey(),
    });
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError("");
    const data = {
      title: form.title.trim(),
      startsAt: new Date(form.startsAt).toISOString(),
      location: form.location.trim(),
      agenda: form.agenda.trim(),
      status: form.status,
      reportTitle: form.reportTitle.trim() || null,
      reportContent: form.reportContent.trim() || null,
      reportUrl: form.reportUrl.trim() || null,
    };
    const options = {
      onSuccess: async () => {
        close();
        await refresh();
      },
      onError: () => setError("L’événement n’a pas pu être enregistré."),
    };
    if (editingId) updateEvent.mutate({ id: editingId, data }, options);
    else createEvent.mutate({ data }, options);
  };

  const remove = (id: string) => {
    if (!window.confirm("Supprimer définitivement cet événement ?")) return;
    deleteEvent.mutate(
      { id },
      {
        onSuccess: refresh,
        onError: () => setError("L’événement n’a pas pu être supprimé."),
      },
    );
  };

  return (
    <section className="vj-enter overflow-hidden rounded-[28px] border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
            <CalendarDays className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-extrabold tracking-[-.03em]">
              Réunions et événements
            </h2>
            <p className="text-xs text-muted-foreground">
              Agenda, participations et comptes rendus
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            close();
            setOpen(true);
          }}
          className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-xs font-extrabold text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> Nouvel événement
        </button>
      </div>

      {open && (
        <form
          onSubmit={submit}
          className="border-b border-border bg-muted/25 p-5 sm:p-6"
        >
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-sm font-extrabold">
              {editingId ? "Modifier l’événement" : "Créer un événement"}
            </h3>
            <button type="button" onClick={close} aria-label="Fermer">
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="mb-2 block text-xs font-extrabold">Titre</span>
              <input
                className="field"
                required
                minLength={3}
                maxLength={160}
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
              />
            </label>
            <label>
              <span className="mb-2 block text-xs font-extrabold">
                Date et heure
              </span>
              <input
                className="field"
                type="datetime-local"
                required
                value={form.startsAt}
                onChange={(e) => update("startsAt", e.target.value)}
              />
            </label>
            <label>
              <span className="mb-2 block text-xs font-extrabold">Lieu</span>
              <input
                className="field"
                required
                minLength={2}
                maxLength={200}
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
              />
            </label>
            <label className="sm:col-span-2">
              <span className="mb-2 block text-xs font-extrabold">
                Ordre du jour
              </span>
              <textarea
                className="field min-h-28 resize-y"
                required
                minLength={3}
                maxLength={4000}
                value={form.agenda}
                onChange={(e) => update("agenda", e.target.value)}
              />
            </label>
            <label>
              <span className="mb-2 block text-xs font-extrabold">État</span>
              <select
                className="field"
                value={form.status}
                onChange={(e) =>
                  update("status", e.target.value as FormState["status"])
                }
              >
                <option value="upcoming">À venir</option>
                <option value="completed">Terminée</option>
                <option value="cancelled">Annulée</option>
              </select>
            </label>
            <label>
              <span className="mb-2 block text-xs font-extrabold">
                Titre du compte rendu
              </span>
              <input
                className="field"
                maxLength={200}
                value={form.reportTitle}
                onChange={(e) => update("reportTitle", e.target.value)}
              />
            </label>
            <label className="sm:col-span-2">
              <span className="mb-2 block text-xs font-extrabold">
                Compte rendu
              </span>
              <textarea
                className="field min-h-36 resize-y"
                maxLength={12000}
                value={form.reportContent}
                onChange={(e) => update("reportContent", e.target.value)}
              />
            </label>
            <label className="sm:col-span-2">
              <span className="mb-2 block text-xs font-extrabold">
                Lien du document
              </span>
              <input
                className="field"
                type="url"
                placeholder="https://…"
                maxLength={1000}
                value={form.reportUrl}
                onChange={(e) => update("reportUrl", e.target.value)}
              />
            </label>
          </div>
          {error && (
            <p className="mt-4 text-xs font-semibold text-destructive">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={createEvent.isPending || updateEvent.isPending}
            className="mt-5 min-h-11 rounded-full bg-foreground px-6 text-xs font-extrabold text-background disabled:opacity-50"
          >
            {editingId
              ? "Enregistrer les modifications"
              : "Publier l’événement"}
          </button>
        </form>
      )}

      <div className="divide-y divide-border">
        {eventsQuery.isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">
            Chargement de l’agenda…
          </p>
        ) : events.length ? (
          events.map((event) => (
            <article
              key={event.id}
              className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:p-6"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-extrabold">{event.title}</h3>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-[9px] font-extrabold uppercase">
                    {event.status === "upcoming"
                      ? "À venir"
                      : event.status === "completed"
                        ? "Terminée"
                        : "Annulée"}
                  </span>
                </div>
                <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />{" "}
                  {displayDate(event.startsAt)}
                </p>
                <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" /> {event.location}
                </p>
                <p className="mt-2 line-clamp-2 text-xs leading-5">
                  {event.agenda}
                </p>
                <p className="mt-2 text-[10px] font-bold text-primary">
                  {event.attendingCount} participe · {event.unavailableCount}{" "}
                  indisponible
                  {event.reportContent || event.reportUrl
                    ? " · Compte rendu publié"
                    : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => edit(event)}
                  className="grid h-10 w-10 place-items-center rounded-full border border-border text-primary"
                  aria-label={`Modifier ${event.title}`}
                >
                  {event.reportContent ? (
                    <FileText className="h-4 w-4" />
                  ) : (
                    <Pencil className="h-4 w-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => remove(event.id)}
                  className="grid h-10 w-10 place-items-center rounded-full border border-border text-destructive"
                  aria-label={`Supprimer ${event.title}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))
        ) : (
          <p className="p-6 text-sm text-muted-foreground">
            Aucun événement publié.
          </p>
        )}
      </div>
    </section>
  );
}
