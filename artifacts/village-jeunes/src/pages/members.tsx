import {
  ArrowRight,
  MapPin,
  RotateCcw,
  Search,
  SlidersHorizontal,
  UsersRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  getListChatPresenceQueryKey,
  getListProfilesQueryKey,
  useListChatPresence,
  useListProfiles,
} from "@workspace/api-client-react";
import { MemberCard } from "@/components/member-card";
import { demoProfiles } from "@/lib/demo-data";

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export default function MembersPage() {
  const profilesQuery = useListProfiles({
    query: { queryKey: getListProfilesQueryKey() },
  });
  const presenceQuery = useListChatPresence({
    query: {
      queryKey: getListChatPresenceQueryKey(),
      refetchInterval: 5_000,
    },
  });
  const profiles = Array.isArray(profilesQuery.data)
    ? profilesQuery.data
    : demoProfiles;
  const [search, setSearch] = useState("");
  const [activity, setActivity] = useState("Toutes");
  const [location, setLocation] = useState("Tous les lieux");
  const [sort, setSort] = useState<"name" | "location">("name");
  const presenceByProfile = useMemo(
    () =>
      new Map(
        (presenceQuery.data ?? []).map((presence) => [
          presence.profileId,
          presence.activity,
        ]),
      ),
    [presenceQuery.data],
  );

  const activities = useMemo(
    () =>
      Array.from(
        new Set(profiles.flatMap((profile) => profile.activities)),
      ).sort((a, b) => a.localeCompare(b, "fr")),
    [profiles],
  );
  const locations = useMemo(
    () =>
      Array.from(new Set(profiles.map((profile) => profile.neighborhood))).sort(
        (a, b) => a.localeCompare(b, "fr"),
      ),
    [profiles],
  );
  const filteredProfiles = useMemo(() => {
    const query = normalizeText(search.trim());
    return profiles
      .filter((profile) => {
        const searchable = normalizeText(
          `${profile.name} ${profile.neighborhood} ${profile.bio} ${profile.activities.join(" ")} ${profile.project ?? ""} ${profile.email ?? ""} ${profile.phone ?? ""}`,
        );
        return (
          (!query || searchable.includes(query)) &&
          (activity === "Toutes" || profile.activities.includes(activity)) &&
          (location === "Tous les lieux" || profile.neighborhood === location)
        );
      })
      .sort((a, b) =>
        sort === "location"
          ? a.neighborhood.localeCompare(b.neighborhood, "fr") ||
            a.name.localeCompare(b.name, "fr")
          : a.name.localeCompare(b.name, "fr"),
      );
  }, [activity, location, profiles, search, sort]);
  const hasFilters =
    Boolean(search) || activity !== "Toutes" || location !== "Tous les lieux";
  const reset = () => {
    setSearch("");
    setActivity("Toutes");
    setLocation("Tous les lieux");
    setSort("name");
  };

  return (
    <div className="space-y-7">
      <section className="vj-enter grid gap-7 overflow-hidden rounded-[28px] bg-foreground px-6 py-8 text-background sm:px-9 sm:py-10 lg:grid-cols-[1fr_.62fr] lg:items-end">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[.18em] text-accent">
            L’annuaire de la communauté
          </p>
          <h1 className="vj-display mt-3 text-6xl leading-[.86] sm:text-7xl">
            Trouver un
            <br />
            <em className="text-primary">talent.</em>
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-background/70">
            Recherchez un nom, une ville, une activité ou un projet parmi les
            profils approuvés de la communauté de Zoboroma.
          </p>
        </div>
        <div className="rounded-2xl border border-background/15 bg-background/8 p-5 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-accent-foreground">
              <UsersRound className="h-5 w-5" />
            </span>
            <div>
              <p className="text-3xl font-extrabold tracking-[-.06em]">
                {profiles.length}
              </p>
              <p className="text-xs font-semibold text-background/60">
                membres recensés
              </p>
            </div>
          </div>
          <Link
            href="/actualites"
            className="mt-5 flex items-center justify-between border-t border-background/15 pt-4 text-xs font-bold text-accent"
          >
            Voir les actualités <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="vj-enter vj-enter-delay-1 rounded-[24px] border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-2 text-xs font-extrabold">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          Affiner la recherche
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-[1.6fr_1fr_1fr_.8fr]">
          <label className="relative block">
            <span className="sr-only">Rechercher un membre</span>
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nom, métier, projet…"
              className="field pl-10"
              data-testid="input-directory-search"
            />
          </label>
          <label>
            <span className="sr-only">Filtrer par activité</span>
            <select
              value={activity}
              onChange={(event) => setActivity(event.target.value)}
              className="field"
              data-testid="select-directory-activity"
            >
              <option>Toutes</option>
              {activities.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Filtrer par lieu</span>
            <select
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              className="field"
              data-testid="select-directory-location"
            >
              <option>Tous les lieux</option>
              {locations.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Trier les membres</span>
            <select
              value={sort}
              onChange={(event) =>
                setSort(event.target.value as "name" | "location")
              }
              className="field"
              data-testid="select-directory-sort"
            >
              <option value="name">Nom A–Z</option>
              <option value="location">Lieu A–Z</option>
            </select>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-xs font-bold text-muted-foreground">
            <strong className="text-foreground">
              {filteredProfiles.length}
            </strong>{" "}
            {filteredProfiles.length > 1 ? "profils trouvés" : "profil trouvé"}
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={reset}
              className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
              data-testid="button-reset-directory"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Effacer les filtres
            </button>
          )}
        </div>
      </section>

      {profilesQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div
              key={item}
              className="h-64 animate-pulse rounded-2xl bg-muted"
            />
          ))}
        </div>
      ) : filteredProfiles.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProfiles.map((profile) => (
            <MemberCard
              key={profile.id}
              profile={profile}
              presenceActivity={presenceByProfile.get(profile.id)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-[24px] border border-dashed border-border bg-card px-6 py-16 text-center">
          <MapPin className="mx-auto h-7 w-7 text-primary" />
          <p className="vj-display mt-4 text-4xl">Aucun profil trouvé.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Modifiez vos critères ou effacez les filtres pour revoir tout
            l’annuaire.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 rounded-full bg-foreground px-5 py-3 text-xs font-bold text-background"
          >
            Voir tous les membres
          </button>
        </div>
      )}
      {profilesQuery.isError && (
        <p className="text-xs font-semibold text-muted-foreground">
          Le serveur se réveille doucement — l’annuaire reste disponible en
          aperçu.
        </p>
      )}
    </div>
  );
}
