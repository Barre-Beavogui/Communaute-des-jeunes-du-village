import {
  BadgeCheck,
  KeyRound,
  Plus,
  ShieldCheck,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { type FormEvent, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetAdminFinanceDashboardQueryKey,
  getListProfilesQueryKey,
  getListRolesQueryKey,
  useAssignRole,
  useCreateRole,
  useDeleteRole,
  useListProfiles,
  useListRoles,
  useRemoveRoleAssignment,
  useUpdateRole,
} from "@workspace/api-client-react";
import { Avatar } from "@/components/village-shell";

const FINANCE_PERMISSION = "finance.manage" as const;

export function AdminRoles() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [financeAccess, setFinanceAccess] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<
    Record<string, string>
  >({});
  const [error, setError] = useState("");
  const rolesQuery = useListRoles({
    query: { retry: false, queryKey: getListRolesQueryKey() },
  });
  const profilesQuery = useListProfiles({
    query: { retry: false, queryKey: getListProfilesQueryKey() },
  });
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();
  const assignRole = useAssignRole();
  const removeAssignment = useRemoveRoleAssignment();
  const roles = rolesQuery.data ?? [];
  const profiles = profilesQuery.data ?? [];

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: getListRolesQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getListProfilesQueryKey() }),
      queryClient.invalidateQueries({
        queryKey: getGetAdminFinanceDashboardQueryKey(),
      }),
    ]);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    setError("");
    createRole.mutate(
      {
        data: {
          name: name.trim(),
          description: description.trim() || null,
          permissions: financeAccess ? [FINANCE_PERMISSION] : [],
        },
      },
      {
        onSuccess: async () => {
          setName("");
          setDescription("");
          setFinanceAccess(false);
          await refresh();
        },
        onError: () => setError("Le rôle n’a pas pu être créé."),
      },
    );
  };

  const toggleFinance = (role: (typeof roles)[number]) => {
    const enabled = role.permissions.includes(FINANCE_PERMISSION);
    setError("");
    updateRole.mutate(
      {
        id: role.id,
        data: {
          name: role.name,
          description: role.description,
          permissions: enabled ? [] : [FINANCE_PERMISSION],
        },
      },
      {
        onSuccess: refresh,
        onError: () =>
          setError("Les accès du rôle n’ont pas pu être modifiés."),
      },
    );
  };

  const assign = (roleId: string) => {
    const profileId = selectedMembers[roleId];
    if (!profileId) return;
    setError("");
    assignRole.mutate(
      { id: roleId, data: { profileId } },
      {
        onSuccess: async () => {
          setSelectedMembers((current) => ({ ...current, [roleId]: "" }));
          await refresh();
        },
        onError: () => setError("Le rôle n’a pas pu être attribué."),
      },
    );
  };

  const unassign = (roleId: string, profileId: string) => {
    setError("");
    removeAssignment.mutate(
      { id: roleId, profileId },
      {
        onSuccess: refresh,
        onError: () => setError("Le rôle n’a pas pu être retiré."),
      },
    );
  };

  const removeRole = (roleId: string, roleName: string) => {
    if (!window.confirm(`Supprimer le rôle « ${roleName} » ?`)) return;
    setError("");
    deleteRole.mutate(
      { id: roleId },
      {
        onSuccess: refresh,
        onError: () => setError("Le rôle n’a pas pu être supprimé."),
      },
    );
  };

  return (
    <section className="vj-enter overflow-hidden rounded-[28px] border border-border bg-card shadow-sm">
      <div className="border-b border-border p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
            <BadgeCheck className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-extrabold tracking-[-.03em]">
              Rôles et responsabilités
            </h2>
            <p className="text-xs text-muted-foreground">
              Créez un rôle, choisissez un membre et décidez de ses accès.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <p className="border-b border-destructive/20 bg-destructive/5 px-5 py-3 text-xs font-semibold text-destructive sm:px-6">
          {error}
        </p>
      )}

      <form
        onSubmit={submit}
        className="border-b border-border bg-muted/20 p-5 sm:p-6"
      >
        <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr_auto] lg:items-end">
          <label className="text-[10px] font-bold uppercase tracking-[.1em] text-muted-foreground">
            Nom du rôle
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={80}
              placeholder="Ex. Responsable finance"
              className="field mt-2"
            />
          </label>
          <label className="text-[10px] font-bold uppercase tracking-[.1em] text-muted-foreground">
            Description publique
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={240}
              placeholder="Mission et responsabilité"
              className="field mt-2"
            />
          </label>
          <button
            type="submit"
            disabled={!name.trim() || createRole.isPending}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-xs font-extrabold text-primary-foreground disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Créer
          </button>
        </div>
        <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <input
            type="checkbox"
            checked={financeAccess}
            onChange={(event) => setFinanceAccess(event.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          <KeyRound className="h-4 w-4 text-primary" />
          <span>
            <span className="block text-xs font-extrabold">
              Autoriser la gestion financière
            </span>
            <span className="mt-1 block text-[10px] text-muted-foreground">
              Le membre pourra modifier les objectifs et les cotisations.
            </span>
          </span>
        </label>
      </form>

      <div className="space-y-4 p-5 sm:p-6">
        {rolesQuery.isLoading ? (
          <div className="h-40 animate-pulse rounded-2xl bg-muted" />
        ) : roles.length ? (
          roles.map((role) => {
            const hasFinanceAccess =
              role.permissions.includes(FINANCE_PERMISSION);
            const availableProfiles = profiles.filter(
              (profile) =>
                !role.assignments.some(
                  (assignment) => assignment.profileId === profile.id,
                ),
            );
            return (
              <article
                key={role.id}
                className="rounded-[22px] border border-border bg-background p-4 sm:p-5"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-extrabold">{role.name}</h3>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[9px] font-extrabold ${hasFinanceAccess ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                      >
                        {hasFinanceAccess
                          ? "Accès finances"
                          : "Rôle public sans accès"}
                      </span>
                    </div>
                    {role.description && (
                      <p className="mt-2 text-xs leading-5 text-muted-foreground">
                        {role.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => toggleFinance(role)}
                      className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-[10px] font-extrabold hover:border-primary hover:text-primary"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {hasFinanceAccess ? "Retirer l’accès" : "Donner l’accès"}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeRole(role.id, role.name)}
                      className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground hover:border-destructive hover:text-destructive"
                      aria-label={`Supprimer ${role.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {role.assignments.map((assignment) => (
                    <span
                      key={assignment.profileId}
                      className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 py-1.5 pl-1.5 pr-2.5 text-[10px] font-extrabold"
                    >
                      <Avatar
                        profile={{
                          name: assignment.memberName,
                          initials: assignment.initials,
                          avatarUrl: assignment.avatarUrl,
                        }}
                        size="sm"
                      />
                      {assignment.memberName}
                      <button
                        type="button"
                        onClick={() => unassign(role.id, assignment.profileId)}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label={`Retirer le rôle à ${assignment.memberName}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                  {!role.assignments.length && (
                    <p className="text-[10px] text-muted-foreground">
                      Aucun membre désigné.
                    </p>
                  )}
                </div>

                <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4 sm:flex-row">
                  <select
                    value={selectedMembers[role.id] ?? ""}
                    onChange={(event) =>
                      setSelectedMembers((current) => ({
                        ...current,
                        [role.id]: event.target.value,
                      }))
                    }
                    className="field mt-0 flex-1"
                  >
                    <option value="">Choisir un membre…</option>
                    {availableProfiles.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => assign(role.id)}
                    disabled={!selectedMembers[role.id] || assignRole.isPending}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-foreground px-4 text-xs font-extrabold text-background disabled:opacity-50"
                  >
                    <UserPlus className="h-4 w-4" /> Attribuer
                  </button>
                </div>
              </article>
            );
          })
        ) : (
          <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Créez le premier rôle de la communauté.
          </p>
        )}
      </div>
    </section>
  );
}
