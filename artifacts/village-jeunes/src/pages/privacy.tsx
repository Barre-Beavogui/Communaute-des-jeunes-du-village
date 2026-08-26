import { Eye, LockKeyhole, ShieldCheck, UserRoundCheck } from "lucide-react";
import { Link } from "wouter";

const principles = [
  {
    icon: UserRoundCheck,
    title: "Des informations utiles",
    text: "Le site collecte les informations nécessaires à l’inscription, à la connexion et à la présentation des membres. Aucun âge n’est demandé.",
  },
  {
    icon: Eye,
    title: "Vous choisissez la visibilité",
    text: "Depuis votre espace membre, vous pouvez afficher ou masquer votre email et votre numéro de téléphone dans l’annuaire.",
  },
  {
    icon: LockKeyhole,
    title: "Un accès réservé",
    text: "L’annuaire, les actualités, les votes et les sondages sont accessibles uniquement aux membres approuvés et connectés.",
  },
  {
    icon: ShieldCheck,
    title: "Vos droits",
    text: "Vous pouvez modifier votre profil depuis votre espace membre et demander à l’administrateur de supprimer votre compte et les données associées.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <section className="vj-enter overflow-hidden rounded-[30px] bg-foreground px-6 py-10 text-background sm:px-10 sm:py-14">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[.2em] text-accent">
          Respect des membres
        </p>
        <h1 className="vj-display mt-4 max-w-3xl text-5xl leading-[.9] sm:text-7xl">
          Vos informations, vos choix.
        </h1>
        <p className="mt-6 max-w-2xl text-sm leading-7 text-background/70">
          Zoboroma Jeunes utilise vos données pour gérer la communauté et vous
          donner accès au site. Cette page explique simplement comment elles
          sont utilisées.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {principles.map(({ icon: Icon, title, text }) => (
          <article
            key={title}
            className="rounded-[24px] border border-border bg-card p-6 shadow-sm"
          >
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </span>
            <h2 className="mt-5 text-lg font-extrabold tracking-[-.03em]">
              {title}
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {text}
            </p>
          </article>
        ))}
      </section>

      <section className="rounded-[24px] border border-border bg-accent/20 p-6 sm:p-8">
        <h2 className="text-lg font-extrabold">Besoin d’aide ?</h2>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          Contactez l’administrateur de la communauté pour demander la
          correction ou la suppression de vos informations.
        </p>
        <Link
          href="/connexion-membre"
          className="mt-5 inline-flex rounded-full bg-foreground px-5 py-3 text-xs font-bold text-background"
        >
          Accéder à mon espace
        </Link>
      </section>
    </div>
  );
}
