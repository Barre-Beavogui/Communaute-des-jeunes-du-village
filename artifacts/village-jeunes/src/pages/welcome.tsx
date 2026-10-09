import { KeyRound, UserPlus } from "lucide-react";
import { Link } from "wouter";

export default function WelcomePage() {
  return (
    <main className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#10241e] px-5 py-10 text-[#17251f]">
      <img
        src="/zoboroma-village.jpg"
        alt=""
        className="absolute inset-0 h-full w-full scale-[1.03] object-cover object-center"
      />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(12,31,25,.78),rgba(18,38,31,.30)_50%,rgba(12,31,25,.70))]" />
      <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]" />
      <section className="relative w-full max-w-sm rounded-2xl border border-white/35 bg-white/92 p-6 shadow-[0_28px_80px_rgba(8,25,19,.35)] backdrop-blur-xl sm:p-8">
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
