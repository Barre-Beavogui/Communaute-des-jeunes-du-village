import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Clock3,
  FolderKanban,
  MapPin,
  Newspaper,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { useMemo } from "react";
import { Link } from "wouter";
import {
  getGetMemberProfileSettingsQueryKey,
  getGetMembersSummaryQueryKey,
  getListAnnouncementsQueryKey,
  getListEventsQueryKey,
  getListProfilesQueryKey,
  useGetMemberProfileSettings,
  useGetMembersSummary,
  useListAnnouncements,
  useListEvents,
  useListProfiles,
} from "@workspace/api-client-react";
import { Avatar } from "@/components/village-shell";
import { getMemberIdentity } from "@/lib/member-session";

function fullDate(value: Date) {
  const label = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(value);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function compactDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function announcementDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export default function HomePage() {
  const member = getMemberIdentity();
  const profilesQuery = useListProfiles({
    query: {
      queryKey: getListProfilesQueryKey(),
      refetchInterval: 60_000,
      refetchOnWindowFocus: true,
    },
  });
  const summaryQuery = useGetMembersSummary({
    query: {
      queryKey: getGetMembersSummaryQueryKey(),
      refetchInterval: 60_000,
      refetchOnWindowFocus: true,
    },
  });
  const settingsQuery = useGetMemberProfileSettings({
    query: {
      queryKey: getGetMemberProfileSettingsQueryKey(),
      refetchOnWindowFocus: true,
    },
  });
  const announcementsQuery = useListAnnouncements({
    query: {
      queryKey: getListAnnouncementsQueryKey(),
      refetchInterval: 60_000,
      refetchOnWindowFocus: true,
    },
  });
  const eventsQuery = useListEvents({
    query: {
      queryKey: getListEventsQueryKey(),
      refetchInterval: 60_000,
      refetchOnWindowFocus: true,
    },
  });
  const profiles = Array.isArray(profilesQuery.data) ? profilesQuery.data : [];
  const summary = summaryQuery.data ?? {
    totalMembers: profiles.length,
    activeProjects: profiles.filter((profile) => profile.project).length,
    topActivities: [],
  };
  const firstName = member?.name.trim().split(/\s+/)[0] || "membre";
  const gender = settingsQuery.data?.gender ?? member?.gender ?? null;
  const honorific =
    gender === "Féminin" ? "Mme" : gender === "Masculin" ? "M." : null;
  const today = useMemo(() => new Date(), []);
  const greeting = today.getHours() >= 18 ? "Bonsoir" : "Bonjour";
  const announcements = announcementsQuery.data ?? [];
  const events = eventsQuery.data ?? [];
  const latestAnnouncement = useMemo(
    () =>
      [...announcements].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )[0],
    [announcements],
  );
  const nextEvent = useMemo(
    () =>
      events
        .filter((event) => event.status === "upcoming")
        .sort(
          (a, b) =>
            new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
        )[0],
    [events],
  );
  const featuredProfiles = profiles
    .filter((profile) => profile.id !== member?.id)
    .slice(0, 4);

  return (
    <div className="space-y-7 sm:space-y-9">
      <section className="vj-enter relative overflow-hidden rounded-[26px] bg-foreground text-background shadow-[0_20px_50px_hsl(300_18%_18%/.16)] sm:rounded-[32px]">
        <div className="vj-orbit-slow absolute -right-24 -top-32 h-72 w-72 rounded-full border-[34px] border-primary/45" />
        <div className="vj-drift absolute -bottom-24 right-1/4 h-48 w-48 rounded-full bg-secondary/45 blur-3xl" />
        <div className="relative grid gap-8 px-5 py-7 sm:px-9 sm:py-10 lg:grid-cols-[1fr_310px] lg:items-end lg:px-12 lg:py-12">
          <div>
            <div className="flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[.2em] text-accent">
              <span className="h-2 w-2 rounded-full bg-accent" />
              Espace membre · {fullDate(today)}
            </div>
            <h1 className="vj-display mt-5 max-w-3xl text-[clamp(3.1rem,12vw,6rem)] leading-[.86] tracking-[-.055em]">
              {greeting}
              {honorific ? ` ${honorific}` : ","}
              <br />
              <em className="break-words text-primary">{firstName}.</em>
            </h1>
            <p className="mt-6 max-w-xl text-sm leading-7 text-background/68 sm:text-base">
              Retrouvez en un regard les nouvelles, les rendez-vous et les
              échanges qui font vivre la communauté.
            </p>
            <div className="mt-7 flex max-w-lg items-start gap-3 border-l-2 border-accent pl-4">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <p className="text-xs font-semibold leading-6 text-background/65">
                Votre point de repère pour suivre les décisions, les rencontres
                et les initiatives de Zoboroma.
              </p>
            </div>
          </div>

          <div className="rounded-[24px] border border-background/15 bg-background/8 p-5 backdrop-blur-md sm:p-6">
            <div className="flex items-center gap-3">
              {member && <Avatar profile={member} size="md" />}
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold">
                  {member?.name ?? "Espace membre"}
                </p>
                <p className="mt-1 text-[10px] font-semibold text-background/50">
                  Profil membre vérifié
                </p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-background/8 p-3">
                <p className="text-2xl font-extrabold tracking-[-.06em]">
                  {summary.totalMembers}
                </p>
                <p className="mt-1 text-[9px] font-bold uppercase tracking-[.12em] text-background/48">
                  Membres
                </p>
              </div>
              <div className="rounded-2xl bg-background/8 p-3">
                <p className="text-2xl font-extrabold tracking-[-.06em]">
                  {summary.activeProjects}
                </p>
                <p className="mt-1 text-[9px] font-bold uppercase tracking-[.12em] text-background/48">
                  Projets
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.08fr_.92fr]">
        <article className="relative overflow-hidden rounded-[26px] border border-border bg-card p-5 shadow-sm sm:p-7">
          <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-primary/10 blur-2xl" />
          <div className="relative flex h-full flex-col">
            <div className="flex items-center justify-between gap-4">
              <span className="inline-flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[.18em] text-primary">
                <CalendarDays className="h-4 w-4" /> Prochain rendez-vous
              </span>
              <Link
                href="/evenements"
                className="text-[10px] font-extrabold text-primary hover:underline"
              >
                Tout l’agenda
              </Link>
            </div>
            {eventsQuery.isLoading ? (
              <div className="mt-6 h-40 animate-pulse rounded-2xl bg-muted" />
            ) : nextEvent ? (
              <>
                <div className="mt-7 flex items-start gap-4 sm:gap-5">
                  <div className="grid h-20 w-20 shrink-0 place-items-center rounded-[22px] bg-primary text-center text-primary-foreground">
                    <span>
                      <strong className="block text-3xl leading-none">
                        {new Date(nextEvent.startsAt).getDate()}
                      </strong>
                      <span className="mt-1 block text-[9px] font-extrabold uppercase tracking-[.15em]">
                        {new Intl.DateTimeFormat("fr-FR", {
                          month: "short",
                        }).format(new Date(nextEvent.startsAt))}
                      </span>
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xl font-extrabold tracking-[-.035em] sm:text-2xl">
                      {nextEvent.title}
                    </h3>
                    <p className="mt-3 flex items-start gap-2 text-xs font-semibold leading-5 text-muted-foreground">
                      <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      <span className="capitalize">
                        {compactDate(nextEvent.startsAt)}
                      </span>
                    </p>
                    <p className="mt-1.5 flex items-start gap-2 text-xs font-semibold leading-5 text-muted-foreground">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      {nextEvent.location}
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs font-semibold text-muted-foreground">
                    {nextEvent.memberResponse === "attending"
                      ? "Votre participation est confirmée."
                      : nextEvent.memberResponse === "unavailable"
                        ? "Vous avez indiqué être indisponible."
                        : `${nextEvent.attendingCount} membre${nextEvent.attendingCount > 1 ? "s" : ""} participe${nextEvent.attendingCount > 1 ? "nt" : ""}.`}
                  </p>
                  <Link
                    href="/evenements"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-foreground px-4 text-xs font-extrabold text-background"
                  >
                    Voir et répondre <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-start justify-center py-10">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-muted text-primary">
                  <CalendarDays className="h-5 w-5" />
                </span>
                <p className="mt-4 text-sm font-extrabold">
                  Aucun rendez-vous programmé
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  La prochaine rencontre apparaîtra ici.
                </p>
              </div>
            )}
          </div>
        </article>

        <article className="overflow-hidden rounded-[26px] border border-border bg-card shadow-sm">
          {latestAnnouncement?.mediaType === "image" &&
            latestAnnouncement.mediaUrl && (
              <img
                src={latestAnnouncement.mediaUrl}
                alt=""
                className="h-36 w-full object-cover sm:h-44"
              />
            )}
          <div className="p-5 sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <span className="inline-flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[.18em] text-primary">
                <Newspaper className="h-4 w-4" /> À la une
              </span>
              {latestAnnouncement && (
                <span className="text-[9px] font-semibold text-muted-foreground">
                  {announcementDate(latestAnnouncement.createdAt)}
                </span>
              )}
            </div>
            {announcementsQuery.isLoading ? (
              <div className="mt-6 h-36 animate-pulse rounded-2xl bg-muted" />
            ) : latestAnnouncement ? (
              <>
                <h3 className="mt-6 text-xl font-extrabold tracking-[-.035em] sm:text-2xl">
                  {latestAnnouncement.title}
                </h3>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
                  {latestAnnouncement.content}
                </p>
                <div className="mt-6 flex items-center justify-between gap-4">
                  <p className="text-[10px] font-bold text-muted-foreground">
                    {latestAnnouncement.likeCount} réaction
                    {latestAnnouncement.likeCount > 1 ? "s" : ""}
                  </p>
                  <Link
                    href="/actualites"
                    className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-4 text-xs font-extrabold text-primary-foreground"
                  >
                    Lire l’annonce <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </>
            ) : (
              <div className="py-10">
                <Sparkles className="h-7 w-7 text-primary" />
                <p className="mt-4 text-sm font-extrabold">
                  Aucune annonce pour le moment
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Les prochaines nouvelles seront affichées ici.
                </p>
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="rounded-[26px] bg-accent/25 p-5 sm:p-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="font-mono text-[9px] font-bold uppercase tracking-[.2em] text-primary">
              La communauté
            </p>
            <h2 className="vj-display mt-2 text-4xl leading-none sm:text-5xl">
              Des visages à découvrir.
            </h2>
          </div>
          <Link
            href="/membres"
            className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full border border-primary/25 bg-card px-4 text-xs font-extrabold text-primary"
          >
            Voir tout l’annuaire <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {profilesQuery.isLoading ? (
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-40 animate-pulse rounded-[22px] bg-card/70"
              />
            ))}
          </div>
        ) : featuredProfiles.length ? (
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {featuredProfiles.map((profile) => (
              <Link
                key={profile.id}
                href={`/membre/${encodeURIComponent(profile.id)}`}
                className="group rounded-[22px] border border-border/70 bg-card p-4 shadow-sm transition active:scale-[.98] sm:hover:-translate-y-1 sm:hover:border-primary/35"
              >
                <div className="flex items-start justify-between gap-2">
                  <Avatar profile={profile} size="lg" />
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </div>
                <h3 className="mt-5 line-clamp-2 text-sm font-extrabold leading-5">
                  {profile.name}
                </h3>
                <p className="mt-2 flex items-start gap-1 text-[10px] font-semibold leading-4 text-muted-foreground">
                  <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                  <span className="line-clamp-2">{profile.neighborhood}</span>
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-[22px] border border-dashed border-border bg-card/70 p-8 text-center">
            <UsersRound className="mx-auto h-7 w-7 text-primary" />
            <p className="mt-3 text-sm font-extrabold">
              L’annuaire est en cours de mise à jour.
            </p>
          </div>
        )}
      </section>

      <section
        className="grid gap-3 sm:grid-cols-3"
        aria-label="Repères de la communauté"
      >
        <div className="flex items-center gap-4 rounded-[22px] border border-border bg-card p-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            <UsersRound className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xl font-extrabold tracking-[-.05em]">
              {summary.totalMembers}
            </p>
            <p className="text-[10px] font-bold text-muted-foreground">
              membres approuvés
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-[22px] border border-border bg-card p-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-secondary/15 text-secondary">
            <FolderKanban className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xl font-extrabold tracking-[-.05em]">
              {summary.activeProjects}
            </p>
            <p className="text-[10px] font-bold text-muted-foreground">
              projets partagés
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-[22px] border border-border bg-card p-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent text-accent-foreground">
            <Sparkles className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold">
              {summary.topActivities[0]?.label ?? "Tous les parcours"}
            </p>
            <p className="text-[10px] font-bold text-muted-foreground">
              activité la plus représentée
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
