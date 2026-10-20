import {
  BadgeCheck,
  CircleDollarSign,
  Coins,
  PiggyBank,
  Save,
  Search,
  ShieldCheck,
  Target,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import type {
  FinanceContributionWrite,
  FinanceDashboard,
  FinanceMemberContribution,
  FinanceMonthWrite,
} from "@workspace/api-client-react";
import { Avatar } from "@/components/village-shell";

const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "GNF",
  maximumFractionDigits: 0,
});

function amount(value: number) {
  return currencyFormatter.format(value);
}

function monthLabel(value: string) {
  const [year, month] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(new Date(year!, month! - 1, 1));
}

function ContributionEditor({
  member,
  expectedPerMember,
  editable,
  saving,
  onSave,
}: {
  member: FinanceMemberContribution;
  expectedPerMember: number;
  editable: boolean;
  saving: boolean;
  onSave: (profileId: string, value: FinanceContributionWrite) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(member.amount));
  const [note, setNote] = useState(member.note ?? "");

  useEffect(() => {
    setValue(String(member.amount));
    setNote(member.note ?? "");
  }, [member.amount, member.note]);

  const save = (event: FormEvent) => {
    event.preventDefault();
    onSave(member.profileId, {
      amount: Math.max(0, Math.round(Number(value) || 0)),
      note: note.trim() || null,
    });
    setEditing(false);
  };

  const status = {
    paid: ["À jour", "bg-secondary/10 text-secondary"],
    partial: ["Partiel", "bg-amber-500/10 text-amber-700"],
    pending: ["À cotiser", "bg-muted text-muted-foreground"],
  }[member.status];

  return (
    <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <Avatar
          profile={{
            name: member.memberName,
            initials: member.initials,
            avatarUrl: member.avatarUrl,
          }}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-extrabold">{member.memberName}</p>
          <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
            {member.neighborhood}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[9px] font-extrabold ${status[1]}`}
        >
          {status[0]}
        </span>
      </div>
      {editing && editable ? (
        <form
          onSubmit={save}
          className="mt-4 space-y-3 border-t border-border pt-4"
        >
          <label className="block text-[9px] font-bold uppercase tracking-[.1em] text-muted-foreground">
            Montant versé (GNF)
            <input
              type="number"
              min="0"
              step="1000"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              className="field mt-2"
            />
          </label>
          <label className="block text-[9px] font-bold uppercase tracking-[.1em] text-muted-foreground">
            Note
            <input
              type="text"
              maxLength={240}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Référence ou précision"
              className="field mt-2"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-xs font-extrabold text-primary-foreground disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" /> Enregistrer
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-xl border border-border px-3 py-2.5 text-xs font-bold"
            >
              Annuler
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-4 flex items-end justify-between gap-3 border-t border-border pt-4">
          <div>
            <p className="text-xl font-extrabold tracking-[-.04em]">
              {amount(member.amount)}
            </p>
            <p className="mt-1 text-[9px] text-muted-foreground">
              Objectif individuel : {amount(expectedPerMember)}
            </p>
            {member.note && (
              <p className="mt-2 text-[10px] text-muted-foreground">
                {member.note}
              </p>
            )}
          </div>
          {editable && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-full border border-border px-3 py-2 text-[10px] font-extrabold hover:border-primary hover:text-primary"
            >
              Modifier
            </button>
          )}
        </div>
      )}
    </article>
  );
}

export function FinanceDashboardView({
  dashboard,
  month,
  onMonthChange,
  editable,
  savingGoal,
  savingProfileId,
  error,
  onUpdateMonth,
  onUpdateContribution,
}: {
  dashboard: FinanceDashboard;
  month: string;
  onMonthChange: (value: string) => void;
  editable: boolean;
  savingGoal: boolean;
  savingProfileId: string | null;
  error: string;
  onUpdateMonth: (value: FinanceMonthWrite) => void;
  onUpdateContribution: (
    profileId: string,
    value: FinanceContributionWrite,
  ) => void;
}) {
  const [target, setTarget] = useState(String(dashboard.targetAmount));
  const [expected, setExpected] = useState(String(dashboard.expectedPerMember));
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    setTarget(String(dashboard.targetAmount));
    setExpected(String(dashboard.expectedPerMember));
  }, [dashboard.targetAmount, dashboard.expectedPerMember, month]);

  const progress = dashboard.targetAmount
    ? Math.min(
        100,
        Math.round((dashboard.totalCollected / dashboard.targetAmount) * 100),
      )
    : 0;
  const filteredMembers = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("fr");
    return dashboard.members.filter(
      (member) =>
        (statusFilter === "all" || member.status === statusFilter) &&
        (!term ||
          `${member.memberName} ${member.neighborhood}`
            .toLocaleLowerCase("fr")
            .includes(term)),
    );
  }, [dashboard.members, search, statusFilter]);

  const submitGoal = (event: FormEvent) => {
    event.preventDefault();
    onUpdateMonth({
      targetAmount: Math.max(0, Math.round(Number(target) || 0)),
      expectedPerMember: Math.max(0, Math.round(Number(expected) || 0)),
    });
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[30px] bg-foreground p-6 text-background shadow-lg sm:p-9">
        <div className="grid gap-7 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-background/10 px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-[.18em] text-accent">
              <WalletCards className="h-3.5 w-3.5" /> Finances communautaires
            </span>
            <h1 className="vj-display mt-5 max-w-3xl text-5xl leading-[.9] sm:text-7xl">
              Cotisations de
              <br />
              <em className="text-accent">{monthLabel(month)}.</em>
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-background/65">
              Suivez l’objectif commun et l’avancement des cotisations de tous
              les membres en toute transparence.
            </p>
          </div>
          <div className="rounded-2xl border border-background/15 bg-background/5 p-5">
            <label className="text-[9px] font-bold uppercase tracking-[.12em] text-background/60">
              Mois affiché
              <input
                type="month"
                value={month}
                onChange={(event) => onMonthChange(event.target.value)}
                className="mt-2 min-h-11 w-full rounded-xl border border-background/15 bg-background/10 px-3 text-sm font-bold text-background [color-scheme:dark]"
              />
            </label>
            <div className="mt-5 flex items-center gap-3 border-t border-background/10 pt-4">
              <ShieldCheck className="h-5 w-5 text-accent" />
              <p className="text-[10px] leading-5 text-background/65">
                Visible par tous les membres. Modifiable uniquement par
                l’administration et les responsables autorisés.
              </p>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <p className="rounded-2xl border border-destructive/20 bg-destructive/5 px-5 py-4 text-xs font-semibold text-destructive">
          {error}
        </p>
      )}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Objectif mensuel", amount(dashboard.targetAmount), Target],
          ["Montant collecté", amount(dashboard.totalCollected), Coins],
          ["Reste à collecter", amount(dashboard.remainingAmount), PiggyBank],
          [
            "Membres contributeurs",
            `${dashboard.contributorCount} / ${dashboard.memberCount}`,
            UsersRound,
          ],
        ].map(([label, value, Icon]) => {
          const CardIcon = Icon as typeof Target;
          return (
            <article
              key={label as string}
              className="rounded-[22px] border border-border bg-card p-5 shadow-sm"
            >
              <CardIcon className="h-5 w-5 text-primary" />
              <p className="mt-4 text-[9px] font-bold uppercase tracking-[.12em] text-muted-foreground">
                {label as string}
              </p>
              <p className="mt-2 text-xl font-extrabold tracking-[-.04em]">
                {value as string}
              </p>
            </article>
          );
        })}
      </section>

      <section className="rounded-[26px] border border-border bg-card p-5 shadow-sm sm:p-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="font-mono text-[9px] font-bold uppercase tracking-[.18em] text-primary">
              Avancement collectif
            </p>
            <p className="mt-2 text-3xl font-extrabold tracking-[-.05em]">
              {progress}% atteint
            </p>
          </div>
          {dashboard.managers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {dashboard.managers.map((manager) => (
                <span
                  key={`${manager.profileId}-${manager.roleName}`}
                  className="inline-flex items-center gap-2 rounded-full bg-primary/8 px-3 py-2 text-[10px] font-extrabold text-primary"
                >
                  <BadgeCheck className="h-3.5 w-3.5" /> {manager.memberName} ·{" "}
                  {manager.roleName}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="mt-5 h-4 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-[width] duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      </section>

      {editable && (
        <form
          onSubmit={submitGoal}
          className="rounded-[26px] border border-primary/20 bg-primary/5 p-5 sm:p-7"
        >
          <div className="flex items-center gap-3">
            <CircleDollarSign className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-lg font-extrabold">Paramètres du mois</h2>
              <p className="text-xs text-muted-foreground">
                Réservé aux personnes autorisées.
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <label className="text-[10px] font-bold uppercase tracking-[.1em] text-muted-foreground">
              Objectif collectif (GNF)
              <input
                type="number"
                min="0"
                step="1000"
                value={target}
                onChange={(event) => setTarget(event.target.value)}
                className="field mt-2"
              />
            </label>
            <label className="text-[10px] font-bold uppercase tracking-[.1em] text-muted-foreground">
              Cotisation attendue par membre
              <input
                type="number"
                min="0"
                step="1000"
                value={expected}
                onChange={(event) => setExpected(event.target.value)}
                className="field mt-2"
              />
            </label>
            <button
              type="submit"
              disabled={savingGoal}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-xs font-extrabold text-primary-foreground disabled:opacity-50"
            >
              <Save className="h-4 w-4" /> Enregistrer
            </button>
          </div>
        </form>
      )}

      <section className="space-y-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="font-mono text-[9px] font-bold uppercase tracking-[.18em] text-primary">
              Détail des cotisations
            </p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-[-.04em]">
              Tous les membres
            </h2>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher"
                className="field mt-0 min-w-56 pl-10"
              />
            </label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="field mt-0 min-w-36"
            >
              <option value="all">Tous les statuts</option>
              <option value="paid">À jour</option>
              <option value="partial">Partiel</option>
              <option value="pending">À cotiser</option>
            </select>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredMembers.map((member) => (
            <ContributionEditor
              key={member.profileId}
              member={member}
              expectedPerMember={dashboard.expectedPerMember}
              editable={editable}
              saving={savingProfileId === member.profileId}
              onSave={onUpdateContribution}
            />
          ))}
        </div>
        {!filteredMembers.length && (
          <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Aucun membre ne correspond à ce filtre.
          </p>
        )}
      </section>
    </div>
  );
}
