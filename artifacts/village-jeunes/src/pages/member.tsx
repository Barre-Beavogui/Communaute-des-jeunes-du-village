import { ArrowLeft, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import { useMemo } from "react";
import { Link, useParams } from "wouter";
import {
  getGetProfileQueryKey,
  getListChatPresenceQueryKey,
  getListProfilesQueryKey,
  useGetProfile,
  useListChatPresence,
  useListProfiles,
} from "@workspace/api-client-react";
import { MemberCard } from "@/components/member-card";
import { Avatar } from "@/components/village-shell";
import { demoProfiles } from "@/lib/demo-data";

export default function MemberPage() {
  const params = useParams<{ id: string }>();
  const id = params.id ?? "";
  const profileQuery = useGetProfile(id, {
    query: { enabled: Boolean(id), queryKey: getGetProfileQueryKey(id) },
  });
  const profilesQuery = useListProfiles({
    query: { queryKey: getListProfilesQueryKey() },
  });
  const presenceQuery = useListChatPresence({
    query: {
      queryKey: getListChatPresenceQueryKey(),
      refetchInterval: 5_000,
    },
  });
  const fallback = useMemo(
    () => demoProfiles.find((profile) => profile.id === id) ?? demoProfiles[0],
    [id],
  );
  const profile =
    profileQuery.data && typeof profileQuery.data.name === "string"
      ? profileQuery.data
      : fallback;
  const profiles = Array.isArray(profilesQuery.data)
    ? profilesQuery.data
    : demoProfiles;
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
  const profileActivity = presenceByProfile.get(profile.id);
  const relatedProfiles = useMemo(
    () =>
      profiles
        .filter((item) => item.id !== profile.id)
        .map((item) => ({
          item,
          score:
            (item.neighborhood === profile.neighborhood ? 2 : 0) +
            item.activities.filter((activity) =>
              profile.activities.includes(activity),
            ).length,
        }))
        .sort(
          (a, b) =>
            b.score - a.score || a.item.name.localeCompare(b.item.name, "fr"),
        )
        .slice(0, 3)
        .map(({ item }) => item),
    [profile, profiles],
  );

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/membres"
        className="vj-enter inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary"
        data-testid="link-back-directory"
      >
        <ArrowLeft className="h-4 w-4" /> Retour à l’annuaire
      </Link>
      {profileQuery.isLoading ? (
        <div
          className="mt-8 h-[500px] animate-pulse rounded-[28px] bg-muted"
          data-testid="skeleton-member-detail"
        />
      ) : (
        <article className="vj-enter mt-6 overflow-hidden rounded-[28px] border border-border bg-card shadow-md">
          <div className="relative h-36 bg-foreground sm:h-48">
            <div className="absolute -bottom-16 left-6 sm:left-10">
              <Avatar profile={profile} size="xl" />
            </div>
            <span className="absolute right-6 top-6 flex items-center gap-1.5 rounded-full bg-background/10 px-3 py-2 text-[10px] font-bold text-background backdrop-blur-sm">
              {profileActivity ? (
                <>
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  {profileActivity === "typing"
                    ? "Écrit…"
                    : profileActivity === "recording"
                      ? "Enregistre un vocal…"
                      : "En ligne"}
                </>
              ) : (
                <>
                  <ShieldCheck className="h-3.5 w-3.5 text-accent" /> Membre
                  approuvé
                </>
              )}
            </span>
          </div>
          <div className="px-6 pb-8 pt-20 sm:px-10 sm:pb-12">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <h1
                  className="vj-display text-5xl leading-none sm:text-6xl"
                  data-testid="text-member-detail-name"
                >
                  {profile.name}
                </h1>
                <p
                  className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground"
                  data-testid="text-member-detail-location"
                >
                  <MapPin className="h-4 w-4 text-primary" />
                  {profile.neighborhood}
                </p>
              </div>
            </div>
            <div className="mt-10 grid gap-10 md:grid-cols-[1fr_250px]">
              <div className="space-y-9">
                <div>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[.17em] text-primary">
                    En quelques mots
                  </p>
                  <p
                    className="mt-3 text-lg leading-8 text-foreground/85"
                    data-testid="text-member-bio"
                  >
                    {profile.bio}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[.17em] text-primary">
                    Ses terrains de jeu
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {profile.activities.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-accent/40 px-3.5 py-2 text-xs font-bold text-accent-foreground"
                        data-testid={`tag-member-activity-${tag}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                {profile.project && (
                  <div className="rounded-2xl bg-secondary px-5 py-5 text-secondary-foreground">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[.17em] text-secondary-foreground/70">
                      Son projet en ce moment
                    </p>
                    <p
                      className="mt-3 text-base font-bold leading-7"
                      data-testid="text-member-project"
                    >
                      {profile.project}
                    </p>
                  </div>
                )}
              </div>
              <aside className="h-fit rounded-2xl border border-border bg-background p-5">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[.17em] text-secondary">
                  Contacter ce membre
                </p>
                <div className="mt-4 space-y-3">
                  {profile.email && (
                    <a
                      href={`mailto:${profile.email}`}
                      className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 text-xs font-bold hover:border-primary hover:text-primary"
                      data-testid="link-member-email"
                    >
                      <Mail className="mt-0.5 h-4 w-4 shrink-0" />
                      <span className="min-w-0 break-all">{profile.email}</span>
                    </a>
                  )}
                  {profile.phone && (
                    <a
                      href={`tel:${profile.phone}`}
                      className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 text-xs font-bold hover:border-primary hover:text-primary"
                      data-testid="link-member-phone"
                    >
                      <Phone className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{profile.phone}</span>
                    </a>
                  )}
                  {!profile.email && !profile.phone && (
                    <p className="text-xs leading-5 text-muted-foreground">
                      Aucune coordonnée renseignée pour ce membre.
                    </p>
                  )}
                </div>
              </aside>
            </div>
          </div>
        </article>
      )}
      {profileQuery.isError && (
        <p
          className="mt-4 text-xs font-semibold text-muted-foreground"
          data-testid="status-member-fallback"
        >
          Profil de démonstration affiché pendant le réveil du serveur.
        </p>
      )}
      {relatedProfiles.length > 0 && (
        <section className="mt-10 space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[.17em] text-primary">
                Continuer la rencontre
              </p>
              <h2 className="vj-display mt-2 text-4xl leading-none">
                D’autres parcours à découvrir.
              </h2>
            </div>
            <Link
              href="/membres"
              className="hidden text-xs font-bold text-primary hover:underline sm:block"
            >
              Tout l’annuaire
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {relatedProfiles.map((item) => (
              <MemberCard
                key={item.id}
                profile={item}
                presenceActivity={presenceByProfile.get(item.id)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
