import { type FormEvent, useState } from "react";
import {
  CheckCircle2,
  KeyRound,
  LockKeyhole,
  LogIn,
  LogOut,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";
import {
  useMemberActivate,
  useMemberLogin,
  useSetMemberPassword,
} from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import {
  clearMemberSession,
  getMemberIdentity,
  hasMemberSession,
  saveMemberSession,
  type MemberIdentity,
} from "@/lib/member-session";

export default function MemberLoginPage() {
  const [, navigate] = useLocation();
  const initialCode =
    new URLSearchParams(window.location.search).get("code") ?? "";
  const [mode, setMode] = useState<"login" | "activate">(
    initialCode ? "activate" : "login",
  );
  const [activationCode, setActivationCode] = useState(initialCode);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [setupToken, setSetupToken] = useState("");
  const [setupProfile, setSetupProfile] = useState<MemberIdentity | null>(null);
  const [passwordCreated, setPasswordCreated] = useState(false);
  const [error, setError] = useState("");
  const [member, setMember] = useState(() =>
    hasMemberSession() ? getMemberIdentity() : null,
  );
  const activate = useMemberActivate();
  const login = useMemberLogin();
  const setMemberPassword = useSetMemberPassword({
    request: setupToken
      ? { headers: { Authorization: `Bearer ${setupToken}` } }
      : undefined,
  });

  const submitLogin = (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setPasswordCreated(false);
    login.mutate(
      { data: { identifier: identifier.trim(), password } },
      {
        onSuccess: (session) => {
          saveMemberSession(session);
          setMember(session.profile);
          navigate("/accueil");
        },
        onError: () =>
          setError(
            "Adresse email, numéro de téléphone ou mot de passe incorrect.",
          ),
      },
    );
  };

  const activateAccount = (event: FormEvent) => {
    event.preventDefault();
    setError("");
    activate.mutate(
      { data: { code: activationCode.trim() } },
      {
        onSuccess: (session) => {
          setSetupToken(session.token);
          setSetupProfile(session.profile);
        },
        onError: () =>
          setError("Ce code n’est pas reconnu ou le compte a déjà été activé."),
      },
    );
  };

  const createPassword = (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (newPassword.length < 8) {
      setError("Le nouveau mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (newPassword !== confirmation) {
      setError("Les deux mots de passe ne sont pas identiques.");
      return;
    }

    setMemberPassword.mutate(
      { data: { password: newPassword } },
      {
        onSuccess: () => {
          setSetupToken("");
          setSetupProfile(null);
          setNewPassword("");
          setConfirmation("");
          setPassword("");
          setPasswordCreated(true);
          setMode("login");
        },
        onError: () =>
          setError(
            "Le mot de passe n’a pas pu être créé. Recommencez la première connexion avec votre code.",
          ),
      },
    );
  };

  const logout = () => {
    clearMemberSession();
    setMember(null);
    setIdentifier("");
    setPassword("");
  };

  if (member) {
    return (
      <div className="mx-auto grid min-h-[65vh] max-w-xl place-items-center">
        <section className="vj-enter w-full rounded-[30px] border border-border bg-card p-7 text-center shadow-md sm:p-10">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-secondary text-secondary-foreground shadow-[5px_5px_0_hsl(var(--accent))]">
            <UserRoundCheck className="h-8 w-8" />
          </span>
          <p className="mt-7 font-mono text-[10px] font-bold uppercase tracking-[.18em] text-secondary">
            Espace membre ouvert
          </p>
          <h1 className="vj-display mt-3 text-5xl">Bonjour {member.name}.</h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-muted-foreground">
            Votre session vous donne accès à l’ensemble du site, aux annonces et
            aux votes.
          </p>
          <Link
            href="/accueil"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-xs font-extrabold text-background"
          >
            Entrer sur le site
          </Link>
          <button
            type="button"
            onClick={logout}
            className="mx-auto mt-4 flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-4 w-4" /> Se déconnecter
          </button>
        </section>
      </div>
    );
  }

  if (setupToken && setupProfile) {
    return (
      <div className="mx-auto grid min-h-[68vh] max-w-xl place-items-center">
        <form
          onSubmit={createPassword}
          className="vj-enter w-full rounded-[28px] border border-border bg-card p-7 shadow-md sm:p-9"
        >
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary text-secondary-foreground">
            <LockKeyhole className="h-6 w-6" />
          </span>
          <p className="mt-6 font-mono text-[10px] font-bold uppercase tracking-[.18em] text-secondary">
            Première connexion
          </p>
          <h1 className="vj-display mt-2 text-5xl">
            Bienvenue {setupProfile.name}.
          </h1>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            Votre code a été reconnu. Choisissez maintenant votre mot de passe
            personnel. Il ne sera jamais affiché à l’administrateur.
          </p>
          <label className="mt-7 block space-y-2 text-xs font-bold">
            Nouveau mot de passe
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={128}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="field"
              placeholder="Au moins 8 caractères"
              data-testid="input-new-member-password"
            />
          </label>
          <label className="mt-4 block space-y-2 text-xs font-bold">
            Confirmer le mot de passe
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={128}
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              className="field"
              placeholder="Retapez le mot de passe"
              data-testid="input-confirm-member-password"
            />
          </label>
          {error && <ErrorMessage text={error} />}
          <button
            type="submit"
            disabled={setMemberPassword.isPending}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-secondary px-5 py-3.5 text-xs font-extrabold text-secondary-foreground disabled:opacity-60"
            data-testid="button-set-member-password"
          >
            <ShieldCheck className="h-4 w-4" />
            {setMemberPassword.isPending
              ? "Enregistrement…"
              : "Créer mon mot de passe"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto grid min-h-[68vh] max-w-5xl items-center gap-10 lg:grid-cols-[1fr_.85fr]">
      <section className="vj-enter">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-secondary-foreground shadow-[5px_5px_0_hsl(var(--accent))]">
          <ShieldCheck className="h-7 w-7" />
        </span>
        <p className="mt-8 font-mono text-[10px] font-bold uppercase tracking-[.18em] text-secondary">
          Accès réservé aux membres
        </p>
        <h1 className="vj-display mt-3 text-6xl leading-[.88] sm:text-7xl">
          Votre espace,
          <br />
          <em className="text-primary">votre communauté.</em>
        </h1>
        <p className="mt-6 max-w-md text-sm leading-7 text-muted-foreground">
          Après validation de votre inscription, l’administrateur vous transmet
          un code personnel et un lien d’activation. Ensuite, vous vous
          connecterez avec votre email ou votre numéro de téléphone.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex text-xs font-extrabold text-primary"
        >
          Pas encore membre ? S’inscrire
        </Link>
      </section>

      <form
        onSubmit={mode === "activate" ? activateAccount : submitLogin}
        className="vj-enter vj-enter-delay-1 rounded-[28px] border border-border bg-card p-7 shadow-md sm:p-9"
      >
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <KeyRound className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-extrabold tracking-[-.04em]">
              {mode === "activate" ? "Première connexion" : "Connexion membre"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {mode === "activate"
                ? "Activez le compte avec le code reçu"
                : "Email ou téléphone et mot de passe"}
            </p>
          </div>
        </div>

        {passwordCreated && (
          <div className="mt-6 rounded-2xl border border-secondary/20 bg-secondary/8 p-4 text-xs leading-5 text-secondary">
            <CheckCircle2 className="mr-2 inline h-4 w-4" />
            Mot de passe créé. Reconnectez-vous maintenant avec l’email ou le
            téléphone fourni lors de votre inscription.
          </div>
        )}

        {mode === "activate" ? (
          <label className="mt-7 block space-y-2 text-xs font-bold">
            Code de première connexion
            <input
              type="text"
              autoComplete="one-time-code"
              required
              minLength={8}
              maxLength={32}
              value={activationCode}
              onChange={(event) =>
                setActivationCode(event.target.value.toUpperCase())
              }
              className="field font-mono uppercase tracking-[.12em]"
              placeholder="ZOB-XXXX-XXXX"
              data-testid="input-member-code"
            />
          </label>
        ) : (
          <>
            <label className="mt-7 block space-y-2 text-xs font-bold">
              Email ou numéro de téléphone
              <input
                type="text"
                autoComplete="username"
                required
                minLength={5}
                maxLength={254}
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                className="field"
                placeholder="vous@exemple.com ou +224…"
                data-testid="input-member-identifier"
              />
            </label>
            <label className="mt-4 block space-y-2 text-xs font-bold">
              Mot de passe
              <input
                type="password"
                autoComplete="current-password"
                required
                minLength={8}
                maxLength={128}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="field"
                placeholder="Votre mot de passe"
                data-testid="input-member-password"
              />
            </label>
          </>
        )}
        {error && <ErrorMessage text={error} />}
        <button
          type="submit"
          disabled={mode === "activate" ? activate.isPending : login.isPending}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3.5 text-xs font-extrabold text-background hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60"
          data-testid="button-member-login"
        >
          <LogIn className="h-4 w-4" />
          {mode === "activate"
            ? activate.isPending
              ? "Vérification…"
              : "Activer mon compte"
            : login.isPending
              ? "Connexion…"
              : "Se connecter"}
        </button>
        <button
          type="button"
          onClick={() => {
            setMode(mode === "activate" ? "login" : "activate");
            setError("");
            setPasswordCreated(false);
          }}
          className="mx-auto mt-5 block text-[10px] font-bold leading-5 text-primary"
        >
          {mode === "activate"
            ? "Mon compte est déjà activé"
            : "C’est ma première connexion"}
        </button>
      </form>
    </div>
  );
}

function ErrorMessage({ text }: { text: string }) {
  return (
    <p className="mt-3 text-xs font-semibold leading-5 text-destructive">
      {text}
    </p>
  );
}
