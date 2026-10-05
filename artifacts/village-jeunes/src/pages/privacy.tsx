import {
  Clock3,
  Database,
  Eye,
  LockKeyhole,
  Server,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";
import { Link } from "wouter";

const principles = [
  {
    icon: UserRoundCheck,
    title: "Des informations utiles",
    text: "Le site collecte les informations nécessaires à l’inscription, à la connexion et à la présentation des membres. Aucun âge n’est demandé.",
  },
  {
    icon: Eye,
    title: "Une visibilité maîtrisée",
    text: "Vous contrôlez l’affichage de votre email et de votre téléphone. Le sexe, la situation matrimoniale et le niveau d’études sont privés par défaut ; seul l’administrateur peut autoriser leur affichage.",
  },
  {
    icon: LockKeyhole,
    title: "Les données sensibles protégées",
    text: "La filiation, le contact d’urgence et les observations restent uniquement accessibles à l’administration et ne sont jamais publiés dans l’annuaire.",
  },
  {
    icon: ShieldCheck,
    title: "Vos droits",
    text: "Vous pouvez modifier votre profil depuis votre espace membre et demander à l’administrateur de supprimer votre compte et les données associées.",
  },
];

const details = [
  {
    icon: Database,
    title: "Données utilisées",
    text: "Identité, photo, coordonnées, résidence, parcours, présentation et informations nécessaires au fonctionnement du compte. Les messages et votes sont associés au profil du membre connecté.",
  },
  {
    icon: Eye,
    title: "Finalités",
    text: "Étudier les inscriptions, publier l’annuaire, permettre la connexion, les annonces, les sondages et les échanges entre membres. Les données ne sont ni vendues ni utilisées pour de la publicité.",
  },
  {
    icon: Server,
    title: "Hébergement",
    text: "L’interface est publiée avec GitHub Pages, l’API fonctionne sur Vercel et les données sont conservées dans une base PostgreSQL gérée par Neon.",
  },
  {
    icon: Clock3,
    title: "Durée de conservation",
    text: "Une demande est conservée le temps de son traitement. Les informations d’un membre sont conservées tant que son compte est actif, puis supprimées lorsque l’administrateur supprime le profil.",
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

      <section className="rounded-[24px] border border-border bg-card p-6 sm:p-8">
        <div className="max-w-2xl">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[.18em] text-primary">
            Transparence
          </p>
          <h2 className="mt-3 text-2xl font-extrabold tracking-[-.04em]">
            Comment les données sont traitées
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Le responsable du traitement est l’administration de Zoboroma
            Jeunes. L’accès aux informations privées est limité aux personnes
            chargées de gérer la communauté.
          </p>
        </div>
        <div className="mt-7 grid gap-6 sm:grid-cols-2">
          {details.map(({ icon: Icon, title, text }) => (
            <article key={title} className="flex gap-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-muted text-primary">
                <Icon className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-extrabold">{title}</h3>
                <p className="mt-1 text-xs leading-6 text-muted-foreground">
                  {text}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[24px] border border-border bg-card p-6 sm:p-8">
        <h2 className="text-lg font-extrabold">Sécurité et confidentialité</h2>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          Les mots de passe et les codes d’activation ne sont pas conservés en
          clair. Les connexions utilisent HTTPS et les accès administrateur et
          membre sont séparés. Malgré ces précautions, aucun service en ligne ne
          peut garantir un risque nul.
        </p>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          Vous pouvez demander l’accès, la correction ou la suppression de vos
          données auprès de l’administrateur. Une demande concernant votre
          profil peut nécessiter une vérification d’identité.
        </p>
        <p className="mt-4 text-[11px] font-semibold text-muted-foreground">
          Dernière mise à jour : 6 octobre 2026
        </p>
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
