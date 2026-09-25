import { KeyRound, UserPlus } from "lucide-react";
import { Link } from "wouter";

export default function WelcomePage() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[#f3f5f2] px-5 py-10 text-[#17251f]">
      <section className="w-full max-w-sm rounded-2xl border border-[#d5dcd7] bg-white p-6 sm:p-8">
        <div className="mb-8 flex items-center justify-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#244f43] text-sm font-bold text-white">
            ZJ
          </span>
          <span className="text-lg font-bold tracking-[-.03em]">
            Zoboroma Jeunes
          </span>
        </div>

        <nav className="grid gap-3" aria-label="Accès au site">
          <Link
            href="/connexion-membre"
            className="flex min-h-14 items-center justify-center gap-3 rounded-xl bg-[#244f43] px-5 text-sm font-bold text-white transition-colors hover:bg-[#1b3d34] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#244f43] focus-visible:ring-offset-2"
            data-testid="link-welcome-login"
          >
            <KeyRound className="h-4 w-4" />
            Se connecter
          </Link>

          <Link
            href="/inscription"
            className="flex min-h-14 items-center justify-center gap-3 rounded-xl border border-[#b9c6bf] bg-white px-5 text-sm font-bold text-[#244f43] transition-colors hover:bg-[#eef2ef] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#244f43] focus-visible:ring-offset-2"
            data-testid="link-welcome-signup"
          >
            <UserPlus className="h-4 w-4" />
            Créer un compte
          </Link>
        </nav>
      </section>
    </main>
  );
}
