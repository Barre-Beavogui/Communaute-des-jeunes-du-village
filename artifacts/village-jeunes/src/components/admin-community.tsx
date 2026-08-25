import { type ChangeEvent, type FormEvent, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getListAnnouncementsQueryKey,
  getListPollsQueryKey,
  useCreateAnnouncement,
  useCreatePoll,
  useDeleteAnnouncement,
  useDeletePoll,
  useListAnnouncements,
  useListPolls,
  useUpdatePollStatus,
} from "@workspace/api-client-react";
import {
  ImagePlus,
  Link2,
  Lock,
  Megaphone,
  Plus,
  Send,
  Trash2,
  Unlock,
  Video,
  Vote,
  X,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { prepareAnnouncementPhoto } from "@/lib/profile-photo";

type MediaMode = "none" | "image" | "video";

export function AdminCommunity() {
  return (
    <div className="grid items-start gap-7 xl:grid-cols-2">
      <AdminAnnouncements />
      <AdminPolls />
    </div>
  );
}

function AdminAnnouncements() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mediaMode, setMediaMode] = useState<MediaMode>("none");
  const [photo, setPhoto] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [formError, setFormError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const announcementsQuery = useListAnnouncements({
    query: { retry: false, queryKey: getListAnnouncementsQueryKey() },
  });
  const createAnnouncement = useCreateAnnouncement();
  const deleteAnnouncement = useDeleteAnnouncement();
  const announcements = announcementsQuery.data ?? [];

  const choosePhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoError("");
    try {
      setPhoto(await prepareAnnouncementPhoto(file));
    } catch (error) {
      setPhoto(null);
      setPhotoError(
        error instanceof Error
          ? error.message
          : "La photo n’a pas pu être préparée.",
      );
    } finally {
      event.target.value = "";
    }
  };

  const publish = (event: FormEvent) => {
    event.preventDefault();
    setFormError("");
    if (mediaMode === "image" && !photo) {
      setFormError("Choisissez une photo avant de publier.");
      return;
    }
    if (mediaMode === "video" && !videoUrl.trim()) {
      setFormError("Collez le lien YouTube ou Vimeo de la vidéo.");
      return;
    }

    createAnnouncement.mutate(
      {
        data: {
          title: title.trim(),
          content: content.trim(),
          mediaType: mediaMode === "none" ? null : mediaMode,
          mediaUrl:
            mediaMode === "image"
              ? photo
              : mediaMode === "video"
                ? videoUrl.trim()
                : null,
        },
      },
      {
        onSuccess: async () => {
          setTitle("");
          setContent("");
          setMediaMode("none");
          setPhoto(null);
          setVideoUrl("");
          await queryClient.invalidateQueries({
            queryKey: getListAnnouncementsQueryKey(),
          });
        },
        onError: () =>
          setFormError(
            "La publication a échoué. Vérifiez le lien vidéo ou reconnectez-vous.",
          ),
      },
    );
  };

  const remove = (id: string) => {
    setDeletingId(id);
    deleteAnnouncement.mutate(
      { id },
      {
        onSuccess: () =>
          queryClient.invalidateQueries({
            queryKey: getListAnnouncementsQueryKey(),
          }),
        onSettled: () => setDeletingId(null),
      },
    );
  };

  return (
    <section className="overflow-hidden rounded-[28px] border border-border bg-card shadow-sm">
      <div className="border-b border-border p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Megaphone className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-extrabold tracking-[-.03em]">
              Publier une annonce
            </h2>
            <p className="text-xs text-muted-foreground">
              Texte, photo ou lien vidéo YouTube/Vimeo
            </p>
          </div>
        </div>

        <form onSubmit={publish} className="mt-6 space-y-4">
          <label className="block space-y-2 text-xs font-bold">
            Titre
            <input
              className="field"
              required
              minLength={3}
              maxLength={120}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ex. Réunion de la jeunesse"
              data-testid="input-announcement-title"
            />
          </label>
          <label className="block space-y-2 text-xs font-bold">
            Information
            <textarea
              className="field min-h-32 resize-y"
              required
              minLength={3}
              maxLength={3000}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Écrivez le message à partager…"
              data-testid="input-announcement-content"
            />
          </label>

          <div>
            <p className="text-xs font-bold">Média facultatif</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(
                [
                  ["none", Link2, "Aucun"],
                  ["image", ImagePlus, "Photo"],
                  ["video", Video, "Vidéo"],
                ] as const
              ).map(([mode, Icon, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setMediaMode(mode)}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-[11px] font-bold ${mediaMode === mode ? "border-primary bg-primary/8 text-primary" : "border-border text-muted-foreground"}`}
                >
                  <Icon className="h-4 w-4" /> {label}
                </button>
              ))}
            </div>
          </div>

          {mediaMode === "image" && (
            <div className="rounded-2xl border border-dashed border-border bg-background p-4">
              {photo ? (
                <div className="relative overflow-hidden rounded-xl">
                  <img
                    src={photo}
                    alt="Aperçu de l’annonce"
                    className="max-h-64 w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setPhoto(null)}
                    className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-foreground text-background"
                    aria-label="Retirer la photo"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center py-5 text-center">
                  <ImagePlus className="h-7 w-7 text-primary" />
                  <span className="mt-2 text-xs font-extrabold">
                    Choisir une photo
                  </span>
                  <span className="mt-1 text-[10px] text-muted-foreground">
                    JPG, PNG ou WebP · 8 Mo maximum
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={choosePhoto}
                    className="sr-only"
                    data-testid="input-announcement-photo"
                  />
                </label>
              )}
              {photoError && (
                <p className="mt-2 text-xs font-semibold text-destructive">
                  {photoError}
                </p>
              )}
            </div>
          )}

          {mediaMode === "video" && (
            <label className="block space-y-2 text-xs font-bold">
              Lien de la vidéo
              <input
                type="url"
                className="field"
                value={videoUrl}
                onChange={(event) => setVideoUrl(event.target.value)}
                placeholder="https://www.youtube.com/watch?v=…"
                data-testid="input-announcement-video"
              />
            </label>
          )}

          {formError && (
            <p className="text-xs font-semibold leading-5 text-destructive">
              {formError}
            </p>
          )}
          <button
            type="submit"
            disabled={createAnnouncement.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3.5 text-xs font-extrabold text-background disabled:opacity-50"
            data-testid="button-publish-announcement"
          >
            <Send className="h-4 w-4" />
            {createAnnouncement.isPending
              ? "Publication…"
              : "Publier maintenant"}
          </button>
        </form>
      </div>

      <div className="p-5 sm:p-6">
        <p className="font-mono text-[9px] font-bold uppercase tracking-[.16em] text-muted-foreground">
          {announcements.length} annonce{announcements.length > 1 ? "s" : ""}{" "}
          publiée{announcements.length > 1 ? "s" : ""}
        </p>
        <div className="mt-3 space-y-3">
          {announcementsQuery.isLoading ? (
            <div className="h-20 animate-pulse rounded-2xl bg-muted" />
          ) : announcements.length ? (
            announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="flex items-center justify-between gap-3 rounded-2xl bg-background p-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold">
                    {announcement.title}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {announcement.likeCount} J’aime ·{" "}
                    {new Date(announcement.createdAt).toLocaleDateString(
                      "fr-FR",
                    )}
                  </p>
                </div>
                <DeleteButton
                  title="Supprimer cette annonce ?"
                  description={`« ${announcement.title} » et tous ses J’aime seront définitivement supprimés.`}
                  pending={deletingId === announcement.id}
                  onDelete={() => remove(announcement.id)}
                />
              </div>
            ))
          ) : (
            <p className="py-5 text-center text-xs text-muted-foreground">
              Aucune annonce.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function AdminPolls() {
  const queryClient = useQueryClient();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [formError, setFormError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const pollsQuery = useListPolls({
    query: { retry: false, queryKey: getListPollsQueryKey() },
  });
  const createPoll = useCreatePoll();
  const updatePoll = useUpdatePollStatus();
  const deletePoll = useDeletePoll();
  const polls = pollsQuery.data ?? [];

  const updateOption = (index: number, value: string) => {
    setOptions((current) =>
      current.map((option, optionIndex) =>
        optionIndex === index ? value : option,
      ),
    );
  };

  const publish = (event: FormEvent) => {
    event.preventDefault();
    setFormError("");
    const cleanOptions = options.map((option) => option.trim()).filter(Boolean);
    if (cleanOptions.length < 2) {
      setFormError("Ajoutez au moins deux choix.");
      return;
    }
    createPoll.mutate(
      { data: { question: question.trim(), options: cleanOptions } },
      {
        onSuccess: async () => {
          setQuestion("");
          setOptions(["", ""]);
          await queryClient.invalidateQueries({
            queryKey: getListPollsQueryKey(),
          });
        },
        onError: () => setFormError("Le sondage n’a pas pu être créé."),
      },
    );
  };

  const changeStatus = (id: string, status: "open" | "closed") => {
    setBusyId(id);
    updatePoll.mutate(
      { id, data: { status } },
      {
        onSuccess: () =>
          queryClient.invalidateQueries({ queryKey: getListPollsQueryKey() }),
        onSettled: () => setBusyId(null),
      },
    );
  };

  const remove = (id: string) => {
    setBusyId(id);
    deletePoll.mutate(
      { id },
      {
        onSuccess: () =>
          queryClient.invalidateQueries({ queryKey: getListPollsQueryKey() }),
        onSettled: () => setBusyId(null),
      },
    );
  };

  return (
    <section className="overflow-hidden rounded-[28px] border border-border bg-card shadow-sm">
      <div className="border-b border-border p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-secondary/10 text-secondary">
            <Vote className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-extrabold tracking-[-.03em]">
              Organiser un sondage
            </h2>
            <p className="text-xs text-muted-foreground">
              Seuls les membres connectés peuvent voter
            </p>
          </div>
        </div>

        <form onSubmit={publish} className="mt-6 space-y-4">
          <label className="block space-y-2 text-xs font-bold">
            Question
            <textarea
              className="field min-h-24 resize-y"
              required
              minLength={3}
              maxLength={240}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Sur quel projet devons-nous travailler ?"
              data-testid="input-poll-question"
            />
          </label>
          <div className="space-y-2">
            <p className="text-xs font-bold">Choix de réponse</p>
            {options.map((option, index) => (
              <div key={index} className="flex gap-2">
                <input
                  className="field"
                  required={index < 2}
                  maxLength={120}
                  value={option}
                  onChange={(event) => updateOption(index, event.target.value)}
                  placeholder={`Choix ${index + 1}`}
                  data-testid={`input-poll-option-${index}`}
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() =>
                      setOptions((current) =>
                        current.filter((_, itemIndex) => itemIndex !== index),
                      )
                    }
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-border text-muted-foreground hover:text-destructive"
                    aria-label={`Retirer le choix ${index + 1}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            {options.length < 6 && (
              <button
                type="button"
                onClick={() => setOptions((current) => [...current, ""])}
                className="flex items-center gap-2 text-[11px] font-bold text-secondary"
              >
                <Plus className="h-4 w-4" /> Ajouter un choix
              </button>
            )}
          </div>
          {formError && (
            <p className="text-xs font-semibold text-destructive">
              {formError}
            </p>
          )}
          <button
            type="submit"
            disabled={createPoll.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-secondary px-5 py-3.5 text-xs font-extrabold text-secondary-foreground disabled:opacity-50"
            data-testid="button-create-poll"
          >
            <Vote className="h-4 w-4" />
            {createPoll.isPending ? "Création…" : "Ouvrir le sondage"}
          </button>
        </form>
      </div>

      <div className="p-5 sm:p-6">
        <p className="font-mono text-[9px] font-bold uppercase tracking-[.16em] text-muted-foreground">
          Sondages publiés
        </p>
        <div className="mt-3 space-y-3">
          {pollsQuery.isLoading ? (
            <div className="h-24 animate-pulse rounded-2xl bg-muted" />
          ) : polls.length ? (
            polls.map((poll) => (
              <div key={poll.id} className="rounded-2xl bg-background p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-extrabold leading-5">
                      {poll.question}
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {poll.totalVotes} vote{poll.totalVotes > 1 ? "s" : ""} ·{" "}
                      {poll.status === "open" ? "ouvert" : "fermé"}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${poll.status === "open" ? "bg-secondary/10 text-secondary" : "bg-muted text-muted-foreground"}`}
                  >
                    {poll.status === "open" ? "Ouvert" : "Fermé"}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busyId === poll.id}
                    onClick={() =>
                      changeStatus(
                        poll.id,
                        poll.status === "open" ? "closed" : "open",
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-[10px] font-bold text-muted-foreground"
                  >
                    {poll.status === "open" ? (
                      <Lock className="h-3.5 w-3.5" />
                    ) : (
                      <Unlock className="h-3.5 w-3.5" />
                    )}
                    {poll.status === "open"
                      ? "Fermer le vote"
                      : "Rouvrir le vote"}
                  </button>
                  <DeleteButton
                    title="Supprimer ce sondage ?"
                    description="Le sondage, ses choix et tous les votes seront définitivement supprimés."
                    pending={busyId === poll.id}
                    onDelete={() => remove(poll.id)}
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="py-5 text-center text-xs text-muted-foreground">
              Aucun sondage.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function DeleteButton({
  title,
  description,
  pending,
  onDelete,
}: {
  title: string;
  description: string;
  pending: boolean;
  onDelete: () => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          disabled={pending}
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-destructive/25 px-3 py-2 text-[10px] font-bold text-destructive disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" /> Supprimer
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={onDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Supprimer définitivement
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
