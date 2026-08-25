import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getListAnnouncementsQueryKey,
  getListPollsQueryKey,
  useListAnnouncements,
  useListPolls,
  useToggleAnnouncementLike,
  useVotePoll,
} from "@workspace/api-client-react";
import {
  BarChart3,
  CheckCircle2,
  Heart,
  KeyRound,
  Megaphone,
  Newspaper,
  Vote,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { getMemberIdentity, hasMemberSession } from "@/lib/member-session";
import { getVideoEmbedUrl } from "@/lib/video";

export default function NewsPage() {
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [actionError, setActionError] = useState("");
  const [likingId, setLikingId] = useState<string | null>(null);
  const [votingPollId, setVotingPollId] = useState<string | null>(null);
  const member = hasMemberSession() ? getMemberIdentity() : null;
  const announcementsQuery = useListAnnouncements();
  const pollsQuery = useListPolls();
  const toggleLike = useToggleAnnouncementLike();
  const vote = useVotePoll();
  const announcements = announcementsQuery.data ?? [];
  const polls = pollsQuery.data ?? [];

  const requireMember = () => {
    if (member) return true;
    navigate("/connexion-membre");
    return false;
  };

  const likeAnnouncement = (id: string) => {
    if (!requireMember()) return;
    setActionError("");
    setLikingId(id);
    toggleLike.mutate(
      { id },
      {
        onSuccess: () =>
          queryClient.invalidateQueries({
            queryKey: getListAnnouncementsQueryKey(),
          }),
        onError: () =>
          setActionError(
            "Votre réaction n’a pas été enregistrée. Reconnectez-vous puis réessayez.",
          ),
        onSettled: () => setLikingId(null),
      },
    );
  };

  const chooseOption = (pollId: string, optionId: string) => {
    if (!requireMember()) return;
    setActionError("");
    setVotingPollId(pollId);
    vote.mutate(
      { id: pollId, data: { optionId } },
      {
        onSuccess: () =>
          queryClient.invalidateQueries({ queryKey: getListPollsQueryKey() }),
        onError: () =>
          setActionError(
            "Votre vote n’a pas été enregistré. Le sondage est peut-être fermé.",
          ),
        onSettled: () => setVotingPollId(null),
      },
    );
  };

  return (
    <div className="space-y-8">
      <section className="vj-enter overflow-hidden rounded-[32px] bg-foreground px-6 py-9 text-background shadow-lg sm:px-10 sm:py-12">
        <div className="grid items-end gap-8 lg:grid-cols-[1fr_.42fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-background/10 px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-[.18em] text-accent">
              <Newspaper className="h-3.5 w-3.5" /> Actualités de Zoboroma
            </span>
            <h1 className="vj-display mt-5 max-w-3xl text-6xl leading-[.86] sm:text-7xl">
              Les nouvelles,
              <br />
              <em className="text-accent">les choix, la voix.</em>
            </h1>
            <p className="mt-6 max-w-xl text-sm leading-7 text-background/65">
              Retrouvez les annonces de la communauté et participez aux
              décisions lorsque vous êtes connecté comme membre.
            </p>
          </div>
          <div className="rounded-2xl border border-background/15 bg-background/5 p-5">
            {member ? (
              <>
                <CheckCircle2 className="h-6 w-6 text-accent" />
                <p className="mt-3 text-sm font-extrabold">
                  Connecté : {member.name}
                </p>
                <p className="mt-2 text-xs leading-5 text-background/60">
                  Vous pouvez aimer et voter. Un seul vote par sondage est
                  compté, mais vous pouvez changer votre choix tant qu’il reste
                  ouvert.
                </p>
              </>
            ) : (
              <>
                <KeyRound className="h-6 w-6 text-accent" />
                <p className="mt-3 text-sm font-extrabold">Espace membre</p>
                <p className="mt-2 text-xs leading-5 text-background/60">
                  Connectez-vous avec votre code personnel pour aimer et voter.
                </p>
                <Link
                  href="/connexion-membre"
                  className="mt-4 inline-flex rounded-full bg-accent px-4 py-2.5 text-[11px] font-extrabold text-accent-foreground"
                >
                  Se connecter
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {actionError && (
        <p className="rounded-2xl border border-destructive/20 bg-destructive/5 px-5 py-4 text-xs font-semibold text-destructive">
          {actionError}
        </p>
      )}

      <div className="grid items-start gap-7 lg:grid-cols-[1fr_380px]">
        <section className="space-y-5" aria-labelledby="announcements-title">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Megaphone className="h-5 w-5" />
            </span>
            <div>
              <p className="font-mono text-[9px] font-bold uppercase tracking-[.18em] text-primary">
                Informations
              </p>
              <h2 id="announcements-title" className="text-xl font-extrabold">
                Annonces de la communauté
              </h2>
            </div>
          </div>

          {announcementsQuery.isLoading ? (
            [1, 2].map((item) => (
              <div
                key={item}
                className="h-72 animate-pulse rounded-[28px] bg-muted"
              />
            ))
          ) : announcementsQuery.isError ? (
            <EmptyState text="Les annonces sont momentanément indisponibles." />
          ) : announcements.length ? (
            announcements.map((announcement) => {
              const embedUrl =
                announcement.mediaType === "video" && announcement.mediaUrl
                  ? getVideoEmbedUrl(announcement.mediaUrl)
                  : null;
              return (
                <article
                  key={announcement.id}
                  className="vj-enter overflow-hidden rounded-[28px] border border-border bg-card shadow-sm"
                  data-testid={`announcement-${announcement.id}`}
                >
                  {announcement.mediaType === "image" &&
                    announcement.mediaUrl && (
                      <img
                        src={announcement.mediaUrl}
                        alt={`Illustration de l’annonce ${announcement.title}`}
                        className="max-h-[520px] w-full object-cover"
                      />
                    )}
                  {embedUrl && (
                    <iframe
                      src={embedUrl}
                      title={`Vidéo : ${announcement.title}`}
                      className="aspect-video w-full bg-foreground"
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  )}
                  <div className="p-5 sm:p-7">
                    <p className="font-mono text-[9px] font-bold uppercase tracking-[.16em] text-muted-foreground">
                      Publié le {formatDate(announcement.createdAt)}
                    </p>
                    <h3 className="mt-2 text-2xl font-extrabold tracking-[-.04em]">
                      {announcement.title}
                    </h3>
                    <p className="mt-4 whitespace-pre-line text-sm leading-7 text-foreground/75">
                      {announcement.content}
                    </p>
                    <button
                      type="button"
                      onClick={() => likeAnnouncement(announcement.id)}
                      disabled={likingId === announcement.id}
                      className={`mt-6 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-extrabold transition ${announcement.likedByMember ? "bg-primary text-primary-foreground" : "border border-border bg-background text-muted-foreground hover:border-primary hover:text-primary"}`}
                      data-testid={`button-like-${announcement.id}`}
                    >
                      <Heart
                        className={`h-4 w-4 ${announcement.likedByMember ? "fill-current" : ""}`}
                      />
                      {announcement.likeCount} J’aime
                    </button>
                  </div>
                </article>
              );
            })
          ) : (
            <EmptyState text="La première annonce sera bientôt publiée." />
          )}
        </section>

        <aside
          className="space-y-5 lg:sticky lg:top-28"
          aria-labelledby="polls-title"
        >
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-secondary/10 text-secondary">
              <Vote className="h-5 w-5" />
            </span>
            <div>
              <p className="font-mono text-[9px] font-bold uppercase tracking-[.18em] text-secondary">
                Participation
              </p>
              <h2 id="polls-title" className="text-xl font-extrabold">
                Votes et sondages
              </h2>
            </div>
          </div>

          {pollsQuery.isLoading ? (
            <div className="h-64 animate-pulse rounded-[28px] bg-muted" />
          ) : pollsQuery.isError ? (
            <EmptyState text="Les sondages sont momentanément indisponibles." />
          ) : polls.length ? (
            polls.map((poll) => (
              <article
                key={poll.id}
                className="rounded-[26px] border border-border bg-card p-5 shadow-sm"
                data-testid={`poll-${poll.id}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-extrabold leading-6">
                    {poll.question}
                  </h3>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 font-mono text-[8px] font-bold uppercase ${poll.status === "open" ? "bg-secondary/10 text-secondary" : "bg-muted text-muted-foreground"}`}
                  >
                    {poll.status === "open" ? "Ouvert" : "Fermé"}
                  </span>
                </div>
                <div className="mt-5 space-y-3">
                  {poll.options.map((option) => {
                    const percentage = poll.totalVotes
                      ? Math.round((option.voteCount / poll.totalVotes) * 100)
                      : 0;
                    const selected = poll.selectedOptionId === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        disabled={
                          poll.status !== "open" || votingPollId === poll.id
                        }
                        onClick={() => chooseOption(poll.id, option.id)}
                        className={`relative w-full overflow-hidden rounded-xl border p-3 text-left disabled:cursor-not-allowed ${selected ? "border-primary" : "border-border"}`}
                        data-testid={`button-vote-${poll.id}-${option.id}`}
                      >
                        <span
                          className="absolute inset-y-0 left-0 bg-primary/8"
                          style={{ width: `${percentage}%` }}
                        />
                        <span className="relative flex items-center justify-between gap-3 text-xs font-bold">
                          <span className="flex items-center gap-2">
                            {selected && (
                              <CheckCircle2 className="h-4 w-4 text-primary" />
                            )}
                            {option.label}
                          </span>
                          <span className="text-muted-foreground">
                            {percentage}%
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-4 flex items-center gap-2 text-[10px] font-semibold text-muted-foreground">
                  <BarChart3 className="h-3.5 w-3.5" />
                  {poll.totalVotes} vote{poll.totalVotes > 1 ? "s" : ""}
                </p>
              </article>
            ))
          ) : (
            <EmptyState text="Aucun sondage en cours pour le moment." />
          )}
        </aside>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[26px] border border-dashed border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
