import {
  ArrowRight,
  BadgeCheck,
  CircleCheckBig,
  KeyRound,
  LayoutDashboard,
  MessagesSquare,
  Newspaper,
  ShieldCheck,
  UserRoundCheck,
  UsersRound,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef } from "react";

export type AdminSection =
  | "overview"
  | "registrations"
  | "members"
  | "content"
  | "communications"
  | "finance";

type AdminSectionDefinition = {
  id: AdminSection;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
};

export const ADMIN_SECTIONS: AdminSectionDefinition[] = [
  {
    id: "overview",
    label: "Vue d’ensemble",
    shortLabel: "Accueil",
    description: "Priorités et accès rapides",
    icon: LayoutDashboard,
  },
  {
    id: "registrations",
    label: "Inscriptions",
    shortLabel: "Inscriptions",
    description: "Demandes et accès membres",
    icon: UserRoundCheck,
  },
  {
    id: "members",
    label: "Membres",
    shortLabel: "Membres",
    description: "Profils, export et visibilité",
    icon: UsersRound,
  },
  {
    id: "content",
    label: "Contenus",
    shortLabel: "Contenus",
    description: "Actualités, sondages et événements",
    icon: Newspaper,
  },
  {
    id: "communications",
    label: "Communications",
    shortLabel: "Messages",
    description: "Groupe, messages et signalements",
    icon: MessagesSquare,
  },
  {
    id: "finance",
    label: "Finances et rôles",
    shortLabel: "Finances",
    description: "Cotisations, responsabilités et accès",
    icon: WalletCards,
  },
];

export function isAdminSection(value: string | null): value is AdminSection {
  return ADMIN_SECTIONS.some((section) => section.id === value);
}

export function AdminDashboardNavigation({
  activeSection,
  pendingRegistrations,
  pendingResets,
  memberCount,
  onChange,
}: {
  activeSection: AdminSection;
  pendingRegistrations: number;
  pendingResets: number;
  memberCount: number;
  onChange: (section: AdminSection) => void;
}) {
  const navRef = useRef<HTMLElement>(null);
  useEffect(() => {
    navRef.current
      ?.querySelector<HTMLElement>('[aria-current="page"]')
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [activeSection]);
  return (
    <aside className="min-w-0 lg:sticky lg:top-24">
      <nav
        ref={navRef}
        aria-label="Navigation de l’administration"
        className="flex gap-2 overflow-x-auto rounded-[24px] border border-border bg-card p-2 shadow-sm lg:flex-col lg:overflow-visible"
      >
        {ADMIN_SECTIONS.map((section) => {
          const Icon = section.icon;
          const active = activeSection === section.id;
          const badge =
            section.id === "registrations"
              ? pendingRegistrations + pendingResets
              : section.id === "members"
                ? memberCount
                : null;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => onChange(section.id)}
              aria-current={active ? "page" : undefined}
              className={`group flex min-w-[172px] items-center gap-3 rounded-[18px] px-3 py-3 text-left transition lg:min-w-0 ${
                active
                  ? "bg-foreground text-background shadow-md"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                  active
                    ? "bg-background/10 text-accent"
                    : "bg-muted text-primary group-hover:bg-card"
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-extrabold">
                  {section.label}
                </span>
                <span
                  className={`mt-0.5 hidden text-[9px] leading-4 lg:block ${
                    active ? "text-background/55" : "text-muted-foreground"
                  }`}
                >
                  {section.description}
                </span>
              </span>
              {badge !== null && (
                <span
                  className={`grid min-w-6 place-items-center rounded-full px-1.5 py-1 text-[9px] font-extrabold ${
                    active
                      ? "bg-accent text-accent-foreground"
                      : section.id === "registrations" && badge > 0
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
      <div className="mt-3 hidden rounded-2xl border border-primary/15 bg-primary/5 p-4 lg:block">
        <p className="flex items-center gap-2 text-[10px] font-extrabold text-primary">
          <ShieldCheck className="h-4 w-4" /> Session sécurisée
        </p>
        <p className="mt-2 text-[9px] leading-4 text-muted-foreground">
          Les modifications sensibles sont contrôlées par le serveur.
        </p>
      </div>
    </aside>
  );
}

export function AdminSectionHeader({ section }: { section: AdminSection }) {
  const definition =
    ADMIN_SECTIONS.find((item) => item.id === section) ?? ADMIN_SECTIONS[0]!;
  const Icon = definition.icon;
  return (
    <div className="flex items-start gap-3 rounded-[24px] border border-border bg-card p-4 shadow-sm sm:p-5">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="font-mono text-[9px] font-bold uppercase tracking-[.16em] text-primary">
          Espace de travail
        </p>
        <h2 className="mt-1 text-xl font-extrabold tracking-[-.04em]">
          {definition.label}
        </h2>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {definition.description}
        </p>
      </div>
    </div>
  );
}

function OverviewCard({
  icon: Icon,
  label,
  value,
  detail,
  tone = "primary",
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  detail: string;
  tone?: "primary" | "secondary" | "neutral";
}) {
  const tones = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/10 text-secondary",
    neutral: "bg-muted text-foreground",
  };
  return (
    <div className="rounded-[22px] border border-border bg-card p-5 shadow-sm">
      <div
        className={`grid h-10 w-10 place-items-center rounded-xl ${tones[tone]}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-5 text-3xl font-extrabold tracking-[-.06em]">{value}</p>
      <p className="mt-1 text-xs font-extrabold">{label}</p>
      <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
        {detail}
      </p>
    </div>
  );
}

export function AdminDashboardOverview({
  pendingRegistrations,
  pendingResets,
  memberCount,
  onChange,
}: {
  pendingRegistrations: number;
  pendingResets: number;
  memberCount: number;
  onChange: (section: AdminSection) => void;
}) {
  const allClear = pendingRegistrations === 0 && pendingResets === 0;
  const shortcuts = ADMIN_SECTIONS.filter(
    (section) => section.id !== "overview",
  );
  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-3">
        <OverviewCard
          icon={UserRoundCheck}
          label="Inscriptions à traiter"
          value={pendingRegistrations}
          detail="Demandes en attente de validation"
        />
        <OverviewCard
          icon={KeyRound}
          label="Accès à réinitialiser"
          value={pendingResets}
          detail="Demandes de mot de passe oublié"
          tone="neutral"
        />
        <OverviewCard
          icon={UsersRound}
          label="Membres publiés"
          value={memberCount}
          detail="Profils actuellement dans l’annuaire"
          tone="secondary"
        />
      </section>

      <section className="overflow-hidden rounded-[26px] border border-border bg-card shadow-sm">
        <div className="border-b border-border p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span
              className={`grid h-10 w-10 place-items-center rounded-xl ${
                allClear
                  ? "bg-secondary/10 text-secondary"
                  : "bg-primary/10 text-primary"
              }`}
            >
              {allClear ? (
                <CircleCheckBig className="h-5 w-5" />
              ) : (
                <BadgeCheck className="h-5 w-5" />
              )}
            </span>
            <div>
              <h3 className="text-base font-extrabold">Priorités du jour</h3>
              <p className="text-[10px] text-muted-foreground">
                {allClear
                  ? "Aucune action urgente pour le moment."
                  : "Commencez par les demandes qui attendent une réponse."}
              </p>
            </div>
          </div>
        </div>
        <div className="divide-y divide-border">
          {pendingRegistrations > 0 && (
            <button
              type="button"
              onClick={() => onChange("registrations")}
              className="flex w-full items-center justify-between gap-4 p-5 text-left hover:bg-muted/50 sm:px-6"
            >
              <span>
                <span className="block text-sm font-extrabold">
                  Examiner {pendingRegistrations} inscription
                  {pendingRegistrations > 1 ? "s" : ""}
                </span>
                <span className="mt-1 block text-[10px] text-muted-foreground">
                  Vérifier les informations avant publication.
                </span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
            </button>
          )}
          {pendingResets > 0 && (
            <button
              type="button"
              onClick={() => onChange("registrations")}
              className="flex w-full items-center justify-between gap-4 p-5 text-left hover:bg-muted/50 sm:px-6"
            >
              <span>
                <span className="block text-sm font-extrabold">
                  Répondre à {pendingResets} demande
                  {pendingResets > 1 ? "s" : ""} d’accès
                </span>
                <span className="mt-1 block text-[10px] text-muted-foreground">
                  Générer puis transmettre un nouveau code.
                </span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
            </button>
          )}
          {allClear && (
            <p className="p-5 text-xs leading-5 text-muted-foreground sm:px-6">
              Les inscriptions et les demandes de réinitialisation sont à jour.
            </p>
          )}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold">Tous les outils</h3>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Accédez directement à la tâche que vous souhaitez effectuer.
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {shortcuts.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => onChange(section.id)}
                className="group flex items-center gap-4 rounded-[22px] border border-border bg-card p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-muted text-primary transition group-hover:bg-primary/10">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-extrabold">
                    {section.label}
                  </span>
                  <span className="mt-1 block text-[10px] leading-4 text-muted-foreground">
                    {section.description}
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
              </button>
            );
          })}
        </div>
      </section>

      <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4 text-[10px] leading-5 text-muted-foreground">
        <ShieldCheck className="mr-2 inline h-4 w-4 text-primary" />
        Les informations privées restent réservées à l’administration. Les accès
        financiers sont accordés ou retirés depuis la rubrique Finances et
        rôles.
      </div>
    </div>
  );
}
