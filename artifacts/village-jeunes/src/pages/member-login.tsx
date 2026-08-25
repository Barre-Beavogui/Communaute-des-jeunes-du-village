import { type FormEvent, useState } from "react";
import {
  KeyRound,
  LogIn,
  LogOut,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";
import { useMemberLogin } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import {
  clearMemberSession,
  getMemberIdentity,
  hasMemberSession,
  saveMemberSession,
} from "@/lib/member-session";

export default function MemberLoginPage() {
  const [, navigate] = useLocation();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [member, setMember] = useState(() =>
    hasMemberSession() ? getMemberIdentity() : null,
  );
  const login = useMemberLogin();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError("");
    login.mutate(
      { data: { code: code.trim() } },
      {
        onSuccess: (session) => {
          saveMemberSession(session);
          setMember(session.profile);
          navigate("/actualites");
        },
        onError: () =>
          setError(
            "Ce code n’est pas reconnu. Vérifiez-le ou demandez un nouveau code à l’administrateur.",
          ),
      },
    );
  };

  const logout = () => {
    clearMemberSession();
    setMember(null);
    setCode("");
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
            Vous pouvez aimer les annonces et participer aux sondages de la
            communauté.
          </p>
          <Link
            href="/actualites"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-xs font-extrabold text-background"
          >
            Voir les actualités
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

  return (
    <div className="mx-auto grid min-h-[68vh] max-w-5xl items-center gap-10 lg:grid-cols-[1fr_.85fr]">
      <section className="vj-enter">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-secondary-foreground shadow-[5px_5px_0_hsl(var(--accent))]">
          <ShieldCheck className="h-7 w-7" />
        </span>
        <p className="mt-8 font-mono text-[10px] font-bold uppercase tracking-[.18em] text-secondary">
          Vote réservé aux membres
        </p>
        <h1 className="vj-display mt-3 text-6xl leading-[.88] sm:text-7xl">
          Votre voix
          <br />
          <em className="text-primary">compte ici.</em>
        </h1>
        <p className="mt-6 max-w-md text-sm leading-7 text-muted-foreground">
          Connectez-vous avec le code personnel transmis par l’administrateur.
          Aucun mot de passe ni âge n’est demandé.
        </p>
      </section>

      <form
        onSubmit={submit}
        className="vj-enter vj-enter-delay-1 rounded-[28px] border border-border bg-card p-7 shadow-md sm:p-9"
      >
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <KeyRound className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-extrabold tracking-[-.04em]">
              Connexion membre
            </h2>
            <p className="text-xs text-muted-foreground">
              Exemple : ZOB-ABCD-2345
            </p>
          </div>
        </div>
        <label className="mt-7 block space-y-2 text-xs font-bold">
          Code personnel
          <input
            type="text"
            autoComplete="one-time-code"
            required
            minLength={8}
            maxLength={32}
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            className="field font-mono uppercase tracking-[.12em]"
            placeholder="ZOB-XXXX-XXXX"
            data-testid="input-member-code"
          />
        </label>
        {error && (
          <p className="mt-3 text-xs font-semibold leading-5 text-destructive">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={login.isPending}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3.5 text-xs font-extrabold text-background hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60"
          data-testid="button-member-login"
        >
          <LogIn className="h-4 w-4" />
          {login.isPending ? "Vérification…" : "Entrer dans l’espace membre"}
        </button>
        <p className="mt-5 text-center text-[10px] leading-5 text-muted-foreground">
          Vous n’avez pas encore de code ? Contactez l’administrateur après
          validation de votre profil.
        </p>
      </form>
    </div>
  );
}
