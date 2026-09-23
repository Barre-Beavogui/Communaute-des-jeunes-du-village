import { ArrowRight, KeyRound, UserPlus, UsersRound } from "lucide-react";
import { Link } from "wouter";

export default function WelcomePage() {
  return (
    <div className="mx-auto flex min-h-[68vh] max-w-5xl items-center">
      <section className="vj-enter w-full overflow-hidden rounded-[32px] border border-border bg-card shadow-md">
        <div className="grid lg:grid-cols-[1.05fr_.95fr]">
          <div className="bg-foreground px-6 py-12 text-background sm:px-10 sm:py-16">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-[5px_5px_0_hsl(var(--accent))]">
              <UsersRound className="h-7 w-7" />
            </span>
            <p className="mt-9 font-mono text-[10px] font-bold uppercase tracking-[.2em] text-accent">
              Bienvenue sur Zoboroma Jeunes
            </p>
            <h1 className="vj-display mt-4 text-6xl leading-[.86] sm:text-7xl">
              Retrouvons-nous
              <br />
              <em className="text-primary">au même endroit.</em>
            </h1>
            <p className="mt-6 max-w-lg text-sm leading-7 text-background/68">
              Connectez-vous pour accéder à la communauté. Si vous n’avez pas
              encore de compte, envoyez votre demande d’inscription.
            </p>
          </div>

          <div className="grid content-center gap-4 p-6 sm:p-10">
            <Link
              href="/connexion-membre"
              className="group rounded-[24px] border border-primary/20 bg-primary p-6 text-primary-foreground transition hover:-translate-y-1 hover:shadow-lg"
              data-testid="link-welcome-login"
            >
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary-foreground/15">
                <KeyRound className="h-5 w-5" />
              </span>
              <h2 className="mt-5 text-2xl font-extrabold tracking-[-.04em]">
                Connectez-vous
              </h2>
              <p className="mt-2 text-xs leading-6 text-primary-foreground/75">
                Utilisez votre email ou votre numéro WhatsApp et votre mot de
                passe.
              </p>
              <span className="mt-5 inline-flex items-center gap-2 text-xs font-extrabold">
                Ouvrir mon espace
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>

            <Link
              href="/inscription"
              className="group rounded-[24px] border border-border bg-background p-6 transition hover:-translate-y-1 hover:border-secondary hover:shadow-lg"
              data-testid="link-welcome-signup"
            >
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-secondary/12 text-secondary">
                <UserPlus className="h-5 w-5" />
              </span>
              <h2 className="mt-5 text-2xl font-extrabold tracking-[-.04em]">
                Créer un compte
              </h2>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">
                Remplissez le formulaire pour demander votre inscription à la
                communauté.
              </p>
              <span className="mt-5 inline-flex items-center gap-2 text-xs font-extrabold text-secondary">
                Commencer l’inscription
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
