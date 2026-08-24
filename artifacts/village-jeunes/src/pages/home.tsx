import {
  ArrowUpRight,
  CheckCircle2,
  FolderKanban,
  MapPin,
  Search,
  ShieldCheck,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  getGetMembersSummaryQueryKey,
  getListProfilesQueryKey,
  useGetMembersSummary,
  useListProfiles,
} from "@workspace/api-client-react";
import { Avatar } from "@/components/village-shell";
import { RotatingWords } from "@/components/rotating-words";
import { demoProfiles } from "@/lib/demo-data";

const fallbackSummary = {
  totalMembers: demoProfiles.length,
  activeProjects: 0,
  topActivities: [
    { label: "Étudiant", count: 7 },
    { label: "Salarié", count: 6 },
    { label: "Autre", count: 4 },
  ],
};

export default function HomePage() {
  const profilesQuery = useListProfiles({
    query: { queryKey: getListProfilesQueryKey() },
  });
  const summaryQuery = useGetMembersSummary({
    query: { queryKey: getGetMembersSummaryQueryKey() },
  });
  const [search, setSearch] = useState("");
  const [activity, setActivity] = useState("Tous");
  const profiles = Array.isArray(profilesQuery.data)
    ? profilesQuery.data
    : demoProfiles;
  const summary =
    summaryQuery.data && typeof summaryQuery.data.totalMembers === "number"
      ? summaryQuery.data
      : fallbackSummary;
  const activities = useMemo(
    () => [
      "Tous",
      ...Array.from(new Set(profiles.flatMap((profile) => profile.activities))),
    ],
    [profiles],
  );
  const filteredProfiles = profiles.filter((profile) => {
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      `${profile.name} ${profile.neighborhood} ${profile.activities.join(" ")}`
        .toLowerCase()
        .includes(query);
    const matchesActivity =
      activity === "Tous" || profile.activities.includes(activity);
    return matchesSearch && matchesActivity;
  });

  return (
    <div className="space-y-9">
      <section className="vj-enter relative overflow-hidden rounded-[28px] bg-foreground px-6 py-9 text-background shadow-[0_20px_45px_hsl(300_18%_18%/.14)] sm:px-10 sm:py-12 lg:px-14 lg:py-14">
        <div className="vj-orbit-slow absolute -right-16 -top-24 h-64 w-64 rounded-full border-[30px] border-accent/80 opacity-90" />
        <div className="vj-drift absolute bottom-[-5rem] right-24 h-48 w-48 rounded-full bg-secondary/80 blur-2xl" />
        <div className="relative max-w-2xl">
          <div className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-accent">
            <span className="h-2 w-2 rounded-full bg-accent" />
            Recensement des jeunes de Zoboroma
          </div>
          <h1 className="vj-display max-w-3xl text-[clamp(3rem,8vw,6.5rem)] leading-[.88] tracking-[-.06em]">
            <span className="sr-only">Les talents de Zoboroma.</span>
            <span aria-hidden="true">
              Les{" "}
              <RotatingWords
                words={["talents", "parcours", "idées", "projets"]}
                minWidth="7.7ch"
                className="text-accent"
              />{" "}
              de
              <br />
              <em className="text-primary">Zoboroma.</em>
            </span>
          </h1>
          <p className="mt-7 max-w-lg text-sm leading-7 text-background/72 sm:text-base">
            Un annuaire vivant pour mieux connaître les parcours, les métiers et
            les projets des jeunes de notre communauté, où qu’ils résident.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/membres"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-extrabold text-accent-foreground hover:-translate-y-1 hover:shadow-[0_9px_0_hsl(var(--primary))]"
              data-testid="link-discover-members"
            >
              Découvrir les membres
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              href="/inscription"
              className="inline-flex items-center gap-2 rounded-full border border-background/25 bg-background/10 px-5 py-3 text-sm font-extrabold text-background backdrop-blur-sm hover:bg-background/20"
              data-testid="link-home-join"
            >
              <UserPlus className="h-4 w-4" /> Rejoindre l’annuaire
            </Link>
          </div>
        </div>
        <div className="absolute bottom-8 right-10 hidden rotate-6 rounded-2xl border border-background/20 bg-background/10 px-4 py-3 backdrop-blur-sm sm:block">
          <p className="font-mono text-[10px] uppercase tracking-widest text-background/60">
            Ici, on partage
          </p>
          <p className="sr-only">des idées, pas des likes.</p>
          <p aria-hidden="true" className="mt-1 text-sm font-bold">
            <RotatingWords
              words={["des idées", "des projets", "des talents"]}
              interval={2800}
              minWidth="7.8ch"
              className="text-accent"
            />
            , pas des likes.
          </p>
        </div>
      </section>

      <section
        className="grid gap-4 sm:grid-cols-3"
        aria-label="Les chiffres du village"
      >
        <div className="vj-enter vj-enter-delay-1 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <UsersRound className="h-5 w-5 text-primary" />
            <span className="font-mono text-[10px] text-muted-foreground">
              01
            </span>
          </div>
          <p
            className="mt-6 text-3xl font-extrabold tracking-[-.06em]"
            data-testid="text-total-members"
          >
            {summary.totalMembers}
          </p>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">
            visages dans le village
          </p>
        </div>
        <div className="vj-enter vj-enter-delay-2 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <FolderKanban className="h-5 w-5 text-secondary" />
            <span className="font-mono text-[10px] text-muted-foreground">
              02
            </span>
          </div>
          <p
            className="mt-6 text-3xl font-extrabold tracking-[-.06em]"
            data-testid="text-active-projects"
          >
            {summary.activeProjects}
          </p>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">
            projets qui prennent vie
          </p>
        </div>
        <div className="vj-enter vj-enter-delay-3 rounded-2xl border border-border bg-accent/35 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-primary">#</span>
            <span className="font-mono text-[10px] text-muted-foreground">
              03
            </span>
          </div>
          <p
            className="mt-6 text-lg font-extrabold tracking-[-.04em]"
            data-testid="text-top-activity"
          >
            {summary.topActivities[0]?.label ?? "Les idées"}
          </p>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">
            statut le plus représenté
          </p>
        </div>
      </section>

      <section className="grid overflow-hidden rounded-[28px] border border-border bg-card lg:grid-cols-[1fr_1.1fr]">
        <div className="bg-primary px-6 py-8 text-primary-foreground sm:px-9 sm:py-10">
          <ShieldCheck className="h-7 w-7 text-accent" />
          <p className="mt-7 font-mono text-[10px] font-bold uppercase tracking-[.18em] text-primary-foreground/70">
            Un recensement responsable
          </p>
          <h2 className="vj-display mt-3 text-4xl leading-[.94] sm:text-5xl">
            La confiance avant la publication.
          </h2>
          <p className="mt-5 max-w-md text-sm leading-7 text-primary-foreground/80">
            Chaque demande est vérifiée par l’équipe. Aucun âge n’est collecté
            et les coordonnées personnelles restent privées.
          </p>
        </div>
        <div className="grid gap-5 px-6 py-8 sm:px-9 sm:py-10">
          {[
            [
              "01",
              "Remplir le formulaire",
              "Quelques informations sur votre parcours et vos activités.",
            ],
            [
              "02",
              "Validation par l’équipe",
              "Une personne responsable relit la demande avant publication.",
            ],
            [
              "03",
              "Bienvenue dans l’annuaire",
              "Le profil approuvé rejoint automatiquement la communauté.",
            ],
          ].map(([number, title, description]) => (
            <div key={number} className="flex gap-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent/45 font-mono text-[10px] font-bold text-primary">
                {number}
              </span>
              <div>
                <p className="flex items-center gap-2 text-sm font-extrabold">
                  <CheckCircle2 className="h-4 w-4 text-secondary" />
                  {title}
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="visages" className="scroll-mt-28 space-y-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[.18em] text-primary">
              La place centrale
            </p>
            <h2 className="vj-display mt-1 text-4xl leading-none sm:text-5xl">
              Qui est dans le coin ?
            </h2>
          </div>
          <div className="flex w-full flex-col gap-3 md:w-auto md:items-end">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Chercher un prénom, une ville, un métier…"
                className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-xs outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10"
                data-testid="input-search-members"
              />
            </div>
            <Link
              href="/membres"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
            >
              Ouvrir la recherche avancée{" "}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {activities.slice(0, 9).map((item) => (
            <button
              type="button"
              key={item}
              onClick={() => setActivity(item)}
              className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-bold ${activity === item ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}
              data-testid={`button-filter-${item.toLowerCase()}`}
            >
              {item}
            </button>
          ))}
        </div>
        {profilesQuery.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="h-56 animate-pulse rounded-2xl bg-muted"
                data-testid={`skeleton-member-${item}`}
              />
            ))}
          </div>
        ) : filteredProfiles.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProfiles.map((profile, index) => (
              <Link
                href={`/membre/${profile.id}`}
                key={profile.id}
                className={`group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm hover:-translate-y-1 hover:border-primary/40 hover:shadow-md ${index === 0 ? "lg:col-span-2" : ""}`}
                data-testid={`card-member-${profile.id}`}
              >
                <div className="flex items-start justify-between">
                  <Avatar profile={profile} size={index === 0 ? "lg" : "md"} />
                  <ArrowUpRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-primary" />
                </div>
                <div className="mt-5">
                  <h3
                    className="text-lg font-extrabold tracking-[-.04em]"
                    data-testid={`text-member-name-${profile.id}`}
                  >
                    {profile.name}
                  </h3>
                  <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {profile.neighborhood}
                  </p>
                  <p className="mt-4 line-clamp-2 text-sm leading-6 text-muted-foreground">
                    {profile.bio}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {profile.activities.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div
            className="rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center"
            data-testid="empty-members"
          >
            <p className="vj-display text-3xl">
              Personne dans ce coin… pour l’instant.
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              Essayez une autre recherche ou invitez un visage familier à
              rejoindre le village.
            </p>
            <Link
              href="/inscription"
              className="mt-6 inline-flex rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground"
              data-testid="link-empty-join"
            >
              Proposer une inscription
            </Link>
          </div>
        )}
        {profilesQuery.isError && (
          <p
            className="text-xs font-semibold text-muted-foreground"
            data-testid="status-members-fallback"
          >
            Le serveur se réveille doucement — voici un aperçu du village.
          </p>
        )}
      </section>
    </div>
  );
}
