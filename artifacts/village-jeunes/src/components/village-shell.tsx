import {
  ArrowUpRight,
  Compass,
  LockKeyhole,
  MapPinned,
  Newspaper,
  ShieldCheck,
  Sparkles,
  UserPlus,
  UsersRound,
} from "lucide-react";
import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useHealthCheck } from "@workspace/api-client-react";

const navItems = [
  { href: "/", label: "Accueil", icon: Compass },
  { href: "/membres", label: "Membres", icon: UsersRound },
  { href: "/actualites", label: "Actualités", icon: Newspaper },
  { href: "/zoboroma", label: "Zoboroma", icon: MapPinned },
  { href: "/inscription", label: "Inscription", icon: UserPlus },
  { href: "/admin", label: "Administration", icon: ShieldCheck },
];

const mobileNavItems = navItems.filter((item) => item.href !== "/zoboroma");

export function VillageShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const health = useHealthCheck();
  const currentYear = new Date().getFullYear();

  return (
    <div className="vj-noise min-h-[100dvh] bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[74px] max-w-[1240px] items-center justify-between px-5 sm:px-8">
          <Link
            href="/"
            className="group flex items-center gap-3"
            data-testid="link-home-logo"
          >
            <span className="grid h-11 w-11 rotate-[-5deg] place-items-center rounded-[13px] bg-primary text-sm font-extrabold tracking-[-0.08em] text-primary-foreground shadow-[4px_4px_0_hsl(var(--accent))] transition-transform group-hover:rotate-0">
              ZJ
            </span>
            <span className="hidden text-[15px] font-extrabold tracking-[-0.04em] sm:block">
              Zoboroma <span className="text-primary">Jeunes</span>
            </span>
          </Link>

          <nav
            className="hidden items-center gap-1 md:flex"
            aria-label="Navigation principale"
          >
            {navItems
              .filter((item) => item.href !== "/inscription")
              .map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === "/"
                    ? location === "/"
                    : location.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    data-testid={`link-nav-${item.label.toLowerCase().replaceAll(" ", "-")}`}
                    className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold ${isActive ? "bg-card text-primary shadow-sm ring-1 ring-border" : "text-muted-foreground hover:bg-card/70 hover:text-foreground"}`}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2.2} />
                    {item.label}
                  </Link>
                );
              })}
          </nav>

          <div className="flex items-center gap-3">
            <div
              className="hidden items-center gap-2 text-[11px] font-semibold text-muted-foreground lg:flex"
              data-testid="status-community"
            >
              <span
                className={`h-2 w-2 rounded-full ${health.isError ? "bg-destructive" : "bg-secondary"}`}
              />
              {health.isError ? "Mode aperçu" : "Village en ligne"}
            </div>
            <Link
              href="/inscription"
              className="flex items-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-xs font-bold text-background hover:-translate-y-0.5 hover:shadow-lg"
              data-testid="link-join-header"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Rejoindre
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1240px] px-5 pb-28 pt-8 sm:px-8 md:pb-12">
        {children}
      </main>

      <footer className="border-t border-border bg-foreground text-background">
        <p className="sr-only">
          Parcours, mémoire, projets, solidarité, Zoboroma.
        </p>
        <div className="vj-footer-ticker border-b border-background/15 bg-primary py-3 text-primary-foreground">
          <div className="vj-footer-ticker-track" aria-hidden="true">
            {[0, 1].map((copy) => (
              <div key={copy} className="flex shrink-0 items-center">
                {[
                  "Parcours",
                  "Mémoire",
                  "Projets",
                  "Solidarité",
                  "Zoboroma",
                ].map((word) => (
                  <span
                    key={`${copy}-${word}`}
                    className="flex items-center font-mono text-[10px] font-bold uppercase tracking-[.22em]"
                  >
                    {word}
                    <span className="mx-5 h-1.5 w-1.5 rounded-full bg-accent" />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="mx-auto max-w-[1240px] px-5 pb-28 pt-10 sm:px-8 sm:pt-12 md:pb-10">
          <div className="grid gap-9 border-b border-background/15 pb-10 lg:grid-cols-[1.25fr_.75fr_.9fr]">
            <div>
              <Link
                href="/"
                className="inline-flex items-center gap-3"
                data-testid="link-footer-home"
              >
                <span className="grid h-11 w-11 rotate-[-5deg] place-items-center rounded-[13px] bg-primary text-sm font-extrabold tracking-[-0.08em] text-primary-foreground shadow-[4px_4px_0_hsl(var(--accent))]">
                  ZJ
                </span>
                <span className="text-base font-extrabold tracking-[-.04em]">
                  Zoboroma <span className="text-primary">Jeunes</span>
                </span>
              </Link>
              <p className="mt-5 max-w-md text-sm leading-7 text-background/62">
                Un espace communautaire pour connaître les parcours, préserver
                la mémoire du village et faire grandir les idées de la jeunesse
                de Zoboroma.
              </p>
            </div>

            <nav aria-label="Navigation du pied de page">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[.18em] text-accent">
                Découvrir
              </p>
              <div className="mt-4 grid gap-3 text-sm font-bold">
                {[
                  ["/membres", "Les membres"],
                  ["/actualites", "Actualités et sondages"],
                  ["/connexion-membre", "Connexion membre"],
                  ["/zoboroma", "Le village"],
                  ["/inscription", "Rejoindre l’annuaire"],
                  ["/admin", "Administration"],
                ].map(([href, label]) => (
                  <Link
                    key={href}
                    href={href}
                    className="group flex w-fit items-center gap-2 text-background/68 hover:text-background"
                  >
                    {label}
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                ))}
              </div>
            </nav>

            <div className="rounded-2xl border border-background/15 bg-background/5 p-5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-foreground">
                <LockKeyhole className="h-4 w-4" />
              </span>
              <p className="mt-4 text-sm font-extrabold">
                La confiance avant tout.
              </p>
              <p className="mt-2 text-xs leading-6 text-background/62">
                Aucun âge n’est collecté. Les coordonnées personnelles des
                membres restent privées et chaque profil est vérifié avant sa
                publication.
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-3 pt-6 text-[10px] font-semibold text-background/48 sm:flex-row sm:items-center">
            <p>© {currentYear} Zoboroma Jeunes · Projet communautaire.</p>
            <p>Guinée forestière · Préfecture de Macenta</p>
          </div>
        </div>
      </footer>

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 border-t border-border/80 bg-background/95 px-2 py-2 backdrop-blur-xl md:hidden"
        aria-label="Navigation mobile"
      >
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? location === "/"
              : location.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-1.5 text-[10px] font-bold ${isActive ? "text-primary" : "text-muted-foreground"}`}
              data-testid={`link-mobile-${item.label.toLowerCase().replaceAll(" ", "-")}`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function Avatar({
  profile,
  size = "md",
}: {
  profile: { initials: string; name: string; avatarUrl?: string | null };
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const sizes = {
    sm: "h-9 w-9 text-[11px]",
    md: "h-14 w-14 text-sm",
    lg: "h-24 w-24 text-xl",
    xl: "h-36 w-36 text-3xl",
  };
  return profile.avatarUrl ? (
    <img
      src={profile.avatarUrl}
      alt={`Portrait de ${profile.name}`}
      className={`${sizes[size]} rounded-[28%] object-cover ring-4 ring-background`}
      data-testid={`img-avatar-${profile.name}`}
    />
  ) : (
    <div
      className={`${sizes[size]} grid place-items-center rounded-[28%] bg-secondary font-extrabold text-secondary-foreground ring-4 ring-background`}
      data-testid={`img-avatar-${profile.name}`}
    >
      {profile.initials}
    </div>
  );
}
