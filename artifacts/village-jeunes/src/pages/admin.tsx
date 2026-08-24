import {
  BriefcaseBusiness,
  Check,
  Clock3,
  KeyRound,
  LogOut,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { type FormEvent, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getListModerationRequestsQueryKey,
  getListProfilesQueryKey,
  useAdminLogin,
  useListModerationRequests,
  useReviewModerationRequest,
} from "@workspace/api-client-react";

const TOKEN_KEY = "zoboroma_admin_token";

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(() =>
    Boolean(sessionStorage.getItem(TOKEN_KEY)),
  );
  const [loginError, setLoginError] = useState("");
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const login = useAdminLogin();
  const requestsQuery = useListModerationRequests({
    query: {
      enabled: authenticated,
      retry: false,
      queryKey: getListModerationRequestsQueryKey(),
    },
  });
  const reviewRequest = useReviewModerationRequest();
  const requests = requestsQuery.data ?? [];

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
  };

  const review = (id: string, status: "approved" | "rejected") => {
    setReviewingId(id);
    reviewRequest.mutate(
      { id, data: { status } },
      {
        onSuccess: async () => {
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
            Cet espace permet de relire les nouvelles inscriptions et d’ajouter
            uniquement les profils approuvés au recensement.
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
            Les nouvelles demandes.
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-6 text-muted-foreground">
            Vérifiez les informations, puis acceptez ou refusez chaque
            inscription.
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
        L’email et le téléphone restent privés. Après validation, seuls le nom,
        le lieu, la présentation et les activités apparaissent publiquement.
      </div>

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
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-muted text-sm font-extrabold text-secondary">
                    {request.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
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
    </div>
  );
}
