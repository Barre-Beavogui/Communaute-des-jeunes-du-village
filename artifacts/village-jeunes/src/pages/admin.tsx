import {
  BriefcaseBusiness,
  Check,
  Clock3,
  Copy,
  KeyRound,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { type FormEvent, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetMembersSummaryQueryKey,
  getListAnnouncementsQueryKey,
  getListModerationRequestsQueryKey,
  getListPasswordResetRequestsQueryKey,
  getListPollsQueryKey,
  getListProfilesQueryKey,
  useAdminLogin,
  useCreatePasswordResetCode,
  useDeleteModerationProfile,
  useGenerateMemberCode,
  useListModerationRequests,
  useListPasswordResetRequests,
  useListProfiles,
  useReviewModerationRequest,
} from "@workspace/api-client-react";
import { AdminCommunity } from "@/components/admin-community";
import { buildMemberInvitation } from "@/lib/member-invitation";
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

const TOKEN_KEY = "zoboroma_admin_token";

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(() =>
    Boolean(sessionStorage.getItem(TOKEN_KEY)),
  );
  const [loginError, setLoginError] = useState("");
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [generatingCodeId, setGeneratingCodeId] = useState<string | null>(null);
  const [resettingRequestId, setResettingRequestId] = useState<string | null>(
    null,
  );
  const [codeError, setCodeError] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [generatedCode, setGeneratedCode] = useState<{
    memberName: string;
    code: string;
    email: string;
    phone: string;
  } | null>(null);
  const login = useAdminLogin();
  const requestsQuery = useListModerationRequests({
    query: {
      enabled: authenticated,
      retry: false,
      queryKey: getListModerationRequestsQueryKey(),
    },
  });
  const membersQuery = useListProfiles({
    query: {
      enabled: authenticated,
      retry: false,
      queryKey: getListProfilesQueryKey(),
    },
  });
  const passwordResetRequestsQuery = useListPasswordResetRequests({
    query: {
      enabled: authenticated,
      retry: false,
      queryKey: getListPasswordResetRequestsQueryKey(),
    },
  });
  const reviewRequest = useReviewModerationRequest();
  const deleteProfile = useDeleteModerationProfile();
  const generateCode = useGenerateMemberCode();
  const createResetCode = useCreatePasswordResetCode();
  const requests = requestsQuery.data ?? [];
  const members = membersQuery.data ?? [];
  const passwordResetRequests = passwordResetRequestsQuery.data ?? [];
  const invitation = generatedCode
    ? buildMemberInvitation(generatedCode)
    : null;

  const openSession = (event: FormEvent) => {
    event.preventDefault();
    setLoginError("");
    login.mutate(
      { data: { password } },
      {
        onSuccess: async (session) => {
          sessionStorage.setItem(TOKEN_KEY, session.token);
          setPassword("");
          setAuthenticated(true);
          await queryClient.invalidateQueries({
            queryKey: getListModerationRequestsQueryKey(),
          });
          await queryClient.invalidateQueries({
            queryKey: getListProfilesQueryKey(),
          });
          await queryClient.invalidateQueries({
            queryKey: getListPasswordResetRequestsQueryKey(),
          });
        },
        onError: () =>
          setLoginError(
            "Mot de passe incorrect ou accès temporairement indisponible.",
          ),
      },
    );
  };

  const logout = () => {
    sessionStorage.removeItem(TOKEN_KEY);
    setAuthenticated(false);
    queryClient.removeQueries({
      queryKey: getListModerationRequestsQueryKey(),
    });
    queryClient.removeQueries({ queryKey: getListProfilesQueryKey() });
    queryClient.removeQueries({
      queryKey: getListPasswordResetRequestsQueryKey(),
    });
    queryClient.removeQueries({ queryKey: getListAnnouncementsQueryKey() });
    queryClient.removeQueries({ queryKey: getListPollsQueryKey() });
  };

  const createMemberCode = (id: string, memberName: string) => {
    setGeneratingCodeId(id);
    setCodeError("");
    generateCode.mutate(
      {
        id,
        data: {
          email: manualEmail.trim() || null,
          phone: manualPhone.trim() || null,
        },
      },
      {
        onSuccess: (result) => {
          setGeneratedCode({
            memberName,
            code: result.code,
            email: manualEmail.trim(),
            phone: manualPhone.trim(),
          });
          setManualEmail("");
          setManualPhone("");
        },
        onError: () =>
          setCodeError(
            "Le code n’a pas pu être créé. Reconnectez-vous puis réessayez.",
          ),
        onSettled: () => setGeneratingCodeId(null),
      },
    );
  };

  const review = (id: string, status: "approved" | "rejected") => {
    setReviewingId(id);
    reviewRequest.mutate(
      { id, data: { status } },
      {
        onSuccess: async (result) => {
          if (status === "approved" && result.memberCode) {
            setGeneratedCode({
              memberName: result.name,
              code: result.memberCode,
              email: result.email,
              phone: result.phone ?? "",
            });
          }
          await Promise.all([
            queryClient.invalidateQueries({
              queryKey: getListModerationRequestsQueryKey(),
            }),
            queryClient.invalidateQueries({
              queryKey: getListProfilesQueryKey(),
            }),
          ]);
        },
        onSettled: () => setReviewingId(null),
      },
    );
  };

  const preparePasswordReset = (id: string) => {
    setResettingRequestId(id);
    setCodeError("");
    createResetCode.mutate(
      { id },
      {
        onSuccess: async (result) => {
          setGeneratedCode({
            memberName: result.memberName,
            code: result.code,
            email: result.email ?? "",
            phone: result.phone ?? "",
          });
          await queryClient.invalidateQueries({
            queryKey: getListPasswordResetRequestsQueryKey(),
          });
        },
        onError: () =>
          setCodeError(
            "Le nouveau code n’a pas pu être créé. Reconnectez-vous puis réessayez.",
          ),
        onSettled: () => setResettingRequestId(null),
      },
    );
  };

  const removeMember = (id: string) => {
    setDeletingId(id);
    setDeleteError("");
    deleteProfile.mutate(
      { id },
      {
        onSuccess: async () => {
          await Promise.all([
            queryClient.invalidateQueries({
              queryKey: getListProfilesQueryKey(),
            }),
            queryClient.invalidateQueries({
              queryKey: getGetMembersSummaryQueryKey(),
            }),
          ]);
        },
        onError: () =>
          setDeleteError(
            "La suppression n’a pas abouti. Reconnectez-vous puis réessayez.",
          ),
        onSettled: () => setDeletingId(null),
      },
    );
  };

  if (!authenticated) {
    return (
      <div className="mx-auto grid min-h-[68vh] max-w-5xl items-center gap-10 lg:grid-cols-[1fr_.85fr]">
        <section className="vj-enter">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-foreground text-accent shadow-[5px_5px_0_hsl(var(--primary))]">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <p className="mt-8 font-mono text-[10px] font-bold uppercase tracking-[.18em] text-primary">
            Accès réservé
          </p>
          <h1 className="vj-display mt-3 text-6xl leading-[.88] sm:text-7xl">
            La maison
            <br />
            <em className="text-primary">de l’équipe.</em>
          </h1>
          <p className="mt-6 max-w-md text-sm leading-7 text-muted-foreground">
            Cet espace permet de relire les nouvelles inscriptions, de valider
            les profils et de gérer les membres déjà publiés.
          </p>
        </section>

        <form
          onSubmit={openSession}
          className="vj-enter vj-enter-delay-1 rounded-[28px] border border-border bg-card p-7 shadow-md sm:p-9"
        >
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <KeyRound className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-extrabold tracking-[-.04em]">
                Connexion administrateur
              </h2>
              <p className="text-xs text-muted-foreground">
                La session reste ouverte pendant huit heures.
              </p>
            </div>
          </div>
          <label className="mt-7 block space-y-2 text-xs font-bold">
            Mot de passe
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="field"
              placeholder="Votre mot de passe administrateur"
              data-testid="input-admin-password"
            />
          </label>
          {loginError && (
            <p className="mt-3 text-xs font-semibold text-destructive">
              {loginError}
            </p>
          )}
          <button
            type="submit"
            disabled={login.isPending}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3.5 text-xs font-extrabold text-background hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60"
            data-testid="button-admin-login"
          >
            <ShieldCheck className="h-4 w-4" />
            {login.isPending ? "Vérification…" : "Ouvrir l’administration"}
          </button>
          <p className="mt-4 text-center text-[10px] font-semibold leading-4 text-muted-foreground">
            Les informations des candidats ne sont jamais affichées dans
            l’annuaire public avant validation.
          </p>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="vj-enter flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[.18em] text-primary">
            Administration Zoboroma
          </p>
          <h1 className="vj-display mt-2 text-5xl leading-[.9] sm:text-6xl">
            Contenus, inscriptions et membres.
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-6 text-muted-foreground">
            Publiez les informations, organisez les votes, validez les nouvelles
            inscriptions et gérez les profils.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-xs font-bold shadow-sm">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-accent/60 text-primary">
              {requests.length}
            </span>
            en attente
          </div>
          <button
            type="button"
            onClick={logout}
            className="grid h-11 w-11 place-items-center rounded-full border border-border bg-card text-muted-foreground hover:border-primary hover:text-primary"
            aria-label="Se déconnecter"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs leading-5 text-muted-foreground">
        <ShieldCheck className="mr-2 inline h-4 w-4 text-primary" />
        Chaque membre choisit si son email et son téléphone sont visibles. À
        chaque approbation, un code de première connexion est créé
        automatiquement pour que vous puissiez le transmettre.
      </div>

      <AdminCommunity />

      <section className="vj-enter overflow-hidden rounded-[28px] border border-border bg-card shadow-sm">
        <div className="flex flex-col justify-between gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent/50 text-primary">
              <KeyRound className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-extrabold tracking-[-.03em]">
                Mots de passe oubliés
              </h2>
              <p className="text-xs text-muted-foreground">
                {passwordResetRequests.length} demande
                {passwordResetRequests.length > 1 ? "s" : ""} en attente
              </p>
            </div>
          </div>
          <p className="max-w-sm text-xs leading-5 text-muted-foreground">
            Créez un nouveau code, puis utilisez le message préparé pour
            l’envoyer par email ou WhatsApp.
          </p>
        </div>
        {passwordResetRequestsQuery.isLoading ? (
          <div className="h-24 animate-pulse bg-muted" />
        ) : passwordResetRequests.length ? (
          <div className="divide-y divide-border">
            {passwordResetRequests.map((resetRequest) => (
              <article
                key={resetRequest.id}
                className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center sm:px-6"
              >
                <div>
                  <p className="text-sm font-extrabold">
                    {resetRequest.memberName}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {resetRequest.email || resetRequest.phone} · demandée le{" "}
                    {new Date(resetRequest.requestedAt).toLocaleDateString(
                      "fr-FR",
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={resettingRequestId === resetRequest.id}
                  onClick={() => preparePasswordReset(resetRequest.id)}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground disabled:opacity-50"
                >
                  <KeyRound className="h-4 w-4" />
                  {resettingRequestId === resetRequest.id
                    ? "Création…"
                    : "Créer le nouveau code"}
                </button>
              </article>
            ))}
          </div>
        ) : (
          <p className="px-6 py-8 text-center text-xs text-muted-foreground">
            Aucune demande de réinitialisation.
          </p>
        )}
      </section>

      {requestsQuery.isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div
              className="h-48 animate-pulse rounded-2xl bg-muted"
              key={item}
            />
          ))}
        </div>
      ) : requestsQuery.isError ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-10 text-center">
          <p className="font-bold text-destructive">
            La session a peut-être expiré.
          </p>
          <button
            type="button"
            onClick={logout}
            className="mt-4 rounded-full bg-foreground px-4 py-2.5 text-xs font-bold text-background"
          >
            Se reconnecter
          </button>
        </div>
      ) : requests.length ? (
        <div className="space-y-4">
          {requests.map((request) => (
            <article
              key={request.id}
              className="vj-enter rounded-[24px] border border-border bg-card p-5 shadow-sm sm:p-6"
              data-testid={`row-request-${request.id}`}
            >
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                <div className="flex min-w-0 items-start gap-4">
                  {request.avatarUrl ? (
                    <img
                      src={request.avatarUrl}
                      alt={`Photo proposée par ${request.name}`}
                      className="h-12 w-12 shrink-0 rounded-2xl object-cover ring-2 ring-background"
                      data-testid={`img-request-avatar-${request.id}`}
                    />
                  ) : (
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-muted text-sm font-extrabold text-secondary">
                      {request.name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="text-lg font-extrabold tracking-[-.03em]">
                      {request.name}
                    </h2>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-[11px] font-semibold text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5" />
                        {request.email}
                      </span>
                      {request.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" />
                          {request.phone}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {request.neighborhood}
                      </span>
                      <span className="flex items-center gap-1">
                        <BriefcaseBusiness className="h-3.5 w-3.5" />
                        {request.profession}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock3 className="h-3.5 w-3.5" />
                        {new Date(request.submittedAt).toLocaleDateString(
                          "fr-FR",
                          { day: "numeric", month: "short", year: "numeric" },
                        )}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 sm:shrink-0">
                  <button
                    type="button"
                    onClick={() => review(request.id, "rejected")}
                    disabled={reviewingId === request.id}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full border border-border px-4 py-2.5 text-xs font-bold text-muted-foreground hover:border-destructive hover:text-destructive disabled:opacity-50"
                  >
                    <X className="h-4 w-4" /> Refuser
                  </button>
                  <button
                    type="button"
                    onClick={() => review(request.id, "approved")}
                    disabled={reviewingId === request.id}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full bg-secondary px-4 py-2.5 text-xs font-bold text-secondary-foreground hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" /> Accepter
                  </button>
                </div>
              </div>
              <div className="mt-5 grid gap-3 border-t border-border pt-5 md:grid-cols-2">
                <div className="rounded-xl bg-background p-4">
                  <p className="font-mono text-[9px] font-bold uppercase tracking-[.16em] text-primary">
                    Présentation
                  </p>
                  <p className="mt-2 text-sm leading-6 text-foreground/80">
                    {request.bio}
                  </p>
                </div>
                <div className="rounded-xl bg-background p-4">
                  <p className="font-mono text-[9px] font-bold uppercase tracking-[.16em] text-secondary">
                    Projet ou envie
                  </p>
                  <p className="mt-2 text-sm leading-6 text-foreground/80">
                    {request.project || "Aucun projet indiqué pour le moment."}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div
          className="rounded-[28px] border border-dashed border-border bg-card px-6 py-20 text-center"
          data-testid="empty-moderation"
        >
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent/50 text-primary">
            <UserRound className="h-6 w-6" />
          </div>
          <h2 className="vj-display mt-5 text-4xl">Tout est à jour.</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Aucune demande n’attend votre validation.
          </p>
        </div>
      )}

      <section className="vj-enter overflow-hidden rounded-[28px] border border-border bg-card shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-secondary/10 text-secondary">
              <UsersRound className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-extrabold tracking-[-.03em]">
                Membres publiés
              </h2>
              <p className="text-xs text-muted-foreground">
                {members.length} profil{members.length > 1 ? "s" : ""} dans
                l’annuaire
              </p>
            </div>
          </div>
          <p className="max-w-sm text-xs leading-5 text-muted-foreground">
            La suppression retire définitivement le profil du site et de la base
            de données.
          </p>
        </div>

        {deleteError && (
          <p className="border-b border-destructive/20 bg-destructive/5 px-5 py-3 text-xs font-semibold text-destructive sm:px-6">
            {deleteError}
          </p>
        )}

        {codeError && (
          <p className="border-b border-destructive/20 bg-destructive/5 px-5 py-3 text-xs font-semibold text-destructive sm:px-6">
            {codeError}
          </p>
        )}

        {generatedCode && invitation && (
          <div className="border-b border-secondary/20 bg-secondary/8 px-5 py-5 sm:px-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div>
                <p className="text-xs font-extrabold text-secondary">
                  Invitation de {generatedCode.memberName}
                </p>
                <p className="mt-2 font-mono text-xl font-bold tracking-[.12em]">
                  {generatedCode.code}
                </p>
                <p className="mt-2 text-[10px] leading-4 text-muted-foreground">
                  Le code et le lien sont déjà insérés dans le message
                  ci-dessous.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setGeneratedCode(null)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border text-muted-foreground"
                aria-label="Fermer l’invitation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="block space-y-2 text-[10px] font-bold">
                Adresse email du membre
                <input
                  type="email"
                  value={generatedCode.email}
                  onChange={(event) =>
                    setGeneratedCode((current) =>
                      current
                        ? { ...current, email: event.target.value }
                        : current,
                    )
                  }
                  className="field"
                  placeholder="membre@exemple.com"
                />
              </label>
              <label className="block space-y-2 text-[10px] font-bold">
                Numéro WhatsApp
                <input
                  type="tel"
                  value={generatedCode.phone}
                  onChange={(event) =>
                    setGeneratedCode((current) =>
                      current
                        ? { ...current, phone: event.target.value }
                        : current,
                    )
                  }
                  className="field"
                  placeholder="+224…"
                />
              </label>
            </div>

            <div className="mt-4 rounded-2xl border border-border bg-card p-4">
              <p className="text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">
                Objet : {invitation.subject}
              </p>
              <pre className="mt-3 whitespace-pre-wrap font-sans text-xs leading-6 text-foreground/75">
                {invitation.message}
              </pre>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {invitation.emailHref ? (
                <a
                  href={invitation.emailHref}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground"
                >
                  <Mail className="h-4 w-4" /> Envoyer par email
                </a>
              ) : (
                <span className="inline-flex cursor-not-allowed items-center gap-2 rounded-full bg-muted px-4 py-2.5 text-xs font-bold text-muted-foreground">
                  <Mail className="h-4 w-4" /> Email manquant
                </span>
              )}
              {invitation.whatsappHref ? (
                <a
                  href={invitation.whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-secondary px-4 py-2.5 text-xs font-bold text-secondary-foreground"
                >
                  <MessageCircle className="h-4 w-4" /> Envoyer sur WhatsApp
                </a>
              ) : (
                <span className="inline-flex cursor-not-allowed items-center gap-2 rounded-full bg-muted px-4 py-2.5 text-xs font-bold text-muted-foreground">
                  <MessageCircle className="h-4 w-4" /> WhatsApp manquant
                </span>
              )}
              <button
                type="button"
                onClick={() =>
                  navigator.clipboard.writeText(invitation.message)
                }
                className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-xs font-bold text-muted-foreground"
              >
                <Copy className="h-4 w-4" /> Copier le message
              </button>
            </div>
          </div>
        )}

        {membersQuery.isLoading ? (
          <div className="space-y-3 p-5 sm:p-6">
            {[1, 2, 3].map((item) => (
              <div
                className="h-16 animate-pulse rounded-2xl bg-muted"
                key={item}
              />
            ))}
          </div>
        ) : membersQuery.isError ? (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">
            Impossible de charger les membres. Reconnectez-vous puis réessayez.
          </div>
        ) : members.length ? (
          <div className="divide-y divide-border">
            {members.map((member) => (
              <article
                key={member.id}
                className="flex flex-col justify-between gap-4 px-5 py-4 sm:flex-row sm:items-center sm:px-6"
                data-testid={`row-member-admin-${member.id}`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  {member.avatarUrl ? (
                    <img
                      src={member.avatarUrl}
                      alt={`Photo de ${member.name}`}
                      className="h-11 w-11 shrink-0 rounded-2xl object-cover"
                    />
                  ) : (
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-muted text-xs font-extrabold text-secondary">
                      {member.initials}
                    </span>
                  )}
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-extrabold">
                      {member.name}
                    </h3>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {member.neighborhood}
                      </span>
                      {member.activities.length > 0 && (
                        <span>• {member.activities.join(", ")}</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        type="button"
                        onClick={() => {
                          setManualEmail("");
                          setManualPhone("");
                        }}
                        disabled={generatingCodeId === member.id}
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-secondary/30 px-4 py-2.5 text-xs font-bold text-secondary hover:bg-secondary hover:text-secondary-foreground disabled:opacity-50"
                        data-testid={`button-member-code-${member.id}`}
                      >
                        <KeyRound className="h-4 w-4" />
                        {generatingCodeId === member.id
                          ? "Création…"
                          : "Code membre"}
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Créer un code pour {member.name} ?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Un nouveau code personnel sera créé. L’ancien code et
                          l’ancien mot de passe cesseront immédiatement de
                          fonctionner. Le membre devra refaire sa première
                          connexion et choisir un nouveau mot de passe.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="space-y-2 text-xs font-bold">
                          Email de connexion
                          <input
                            type="email"
                            value={manualEmail}
                            onChange={(event) =>
                              setManualEmail(event.target.value)
                            }
                            className="field"
                            placeholder="membre@exemple.com"
                          />
                        </label>
                        <label className="space-y-2 text-xs font-bold">
                          Téléphone / WhatsApp
                          <input
                            type="tel"
                            value={manualPhone}
                            onChange={(event) =>
                              setManualPhone(event.target.value)
                            }
                            className="field"
                            placeholder="+224…"
                          />
                        </label>
                        <p className="text-[10px] leading-4 text-muted-foreground sm:col-span-2">
                          Indiquez au moins l’email ou le téléphone. Le membre
                          utilisera cet identifiant après avoir créé son mot de
                          passe.
                        </p>
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          disabled={!manualEmail.trim() && !manualPhone.trim()}
                          onClick={() =>
                            createMemberCode(member.id, member.name)
                          }
                          className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                        >
                          Créer le code
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        type="button"
                        disabled={deletingId === member.id}
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-destructive/30 px-4 py-2.5 text-xs font-bold text-destructive hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50"
                        data-testid={`button-delete-member-${member.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                        {deletingId === member.id
                          ? "Suppression…"
                          : "Supprimer"}
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Supprimer ce membre ?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Le profil de {member.name} disparaîtra immédiatement
                          de l’annuaire. Ses réactions et ses votes seront
                          également supprimés. Cette action est définitive.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => removeMember(member.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Supprimer définitivement
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">
            Aucun membre publié pour le moment.
          </div>
        )}
      </section>
    </div>
  );
}
