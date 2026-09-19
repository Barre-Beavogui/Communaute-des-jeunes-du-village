import { RotatingWords } from "@/components/rotating-words";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  Flag,
  Globe2,
  ListChecks,
  MapPin,
  Sparkles,
  Users,
} from "lucide-react";
import { Link } from "wouter";

const reportPdfUrl = `${import.meta.env.BASE_URL}documents/compte-rendu-assemblee-generale-13-septembre-2026.pdf`;

const centralTeam = [
  ["Gbadé Koivogui", "Coordinateur général"],
  ["Pévé Koivogui", "Planification et suivi"],
  ["Barrè Béavogui", "Rapportage et documentation"],
  ["Amos Kalivogui", "Gestion de la base de données"],
  ["Diarra Onivogui", "Gestion financière"],
  ["Emile Koivogui", "Communication"],
  ["Esaie Koévogui", "Conseiller principal"],
];

const zoneCoordinators = [
  ["Mariame Koulibali", "Siguiri"],
  ["Gbadé Béavogui", "Zone spéciale de Conakry"],
  ["Esaie Koévogui", "Boké"],
  ["Diarra Onivogui", "Mamou"],
  ["Agatte Koivogui", "Macenta"],
  ["Moussa Béavogui", "N’Zérékoré"],
  ["Daniel Koly Koivogui", "Kindia"],
  ["Gnakoï Grovogui", "Libéria"],
];

const mission = [
  "Examiner, analyser et hiérarchiser les préoccupations de la communauté.",
  "Identifier les priorités selon leur urgence, leur importance et leur impact.",
  "Élaborer une feuille de route avec des responsables et des échéances.",
  "Suivre les actions retenues pour transformer les décisions en résultats.",
  "Mobiliser les compétences et les ressources disponibles.",
  "Communiquer régulièrement et rendre compte des résultats obtenus.",
  "Maintenir la mobilisation de la jeunesse et la participation des membres.",
];

const nextQuestions = [
  "Les critères et les conditions d’adhésion à l’association.",
  "La place des jeunes ayant un lien avec Zoboroma par leur mère.",
  "Le montant et les modalités d’une éventuelle cotisation mensuelle.",
  "Les règles de représentation et de participation des membres.",
];

export default function GeneralAssemblyReportPage() {
  return (
    <article className="space-y-8">
      <Link
        href="/actualites"
        className="vj-enter inline-flex items-center gap-2 text-xs font-extrabold text-muted-foreground transition hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Retour aux actualités
      </Link>

      <header className="vj-enter relative overflow-hidden rounded-[32px] bg-foreground px-6 py-10 text-background shadow-lg sm:px-10 sm:py-14 lg:px-14 lg:py-16">
        <div className="vj-drift absolute -right-16 -top-20 h-64 w-64 rounded-full bg-primary/35 blur-3xl" />
        <div className="vj-orbit-slow absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-secondary/35 blur-3xl" />
        <span
          aria-hidden="true"
          className="vj-orbit-slow absolute right-9 top-9 hidden rotate-3 rounded-full border border-background/15 bg-background/10 px-4 py-2 font-mono text-[9px] font-bold uppercase tracking-[.16em] text-accent backdrop-blur sm:block"
        >
          Cohésion
        </span>
        <span
          aria-hidden="true"
          className="vj-drift absolute bottom-9 right-16 hidden -rotate-2 rounded-full border border-background/15 bg-background/10 px-4 py-2 font-mono text-[9px] font-bold uppercase tracking-[.16em] text-background/70 backdrop-blur lg:block"
          style={{ animationDelay: "-3s" }}
        >
          Réalisations concrètes
        </span>

        <div className="relative max-w-4xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-background/10 px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-[.18em] text-accent">
            <FileText className="h-3.5 w-3.5" /> Document officiel
          </span>
          <h1 className="vj-display mt-6 text-5xl leading-[.9] sm:text-6xl lg:text-7xl">
            Première Assemblée générale
            <span className="mt-2 block text-accent">
              le comité est{" "}
              <RotatingWords
                words={["présenté.", "validé.", "en action."]}
                interval={2400}
                minWidth="5.5em"
              />
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-sm leading-7 text-background/70 sm:text-base">
            Compte rendu de la réunion qui a officiellement lancé les activités
            du Comité provisoire de coordination de la jeunesse de Zoboroma.
          </p>

          <div className="mt-7 flex flex-wrap gap-x-5 gap-y-3 text-xs font-bold text-background/75">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-accent" /> 13 septembre 2026
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-accent" /> 20h00 – 21h30
            </span>
            <span className="inline-flex items-center gap-2">
              <Globe2 className="h-4 w-4 text-accent" /> Réunion en ligne
            </span>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={reportPdfUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-5 py-3 text-xs font-extrabold text-accent-foreground transition hover:-translate-y-0.5"
            >
              <FileText className="h-4 w-4" /> Lire le PDF complet
            </a>
            <a
              href={reportPdfUrl}
              download
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-background/20 bg-background/5 px-5 py-3 text-xs font-extrabold text-background transition hover:bg-background/10"
            >
              <Download className="h-4 w-4" /> Télécharger
            </a>
          </div>
        </div>
      </header>

      <section
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        aria-label="Le compte rendu en chiffres"
      >
        <ReportStat value="15" label="membres présentés" icon={Users} />
        <ReportStat value="8" label="zones coordonnées" icon={MapPin} />
        <ReportStat value="1 an" label="de mandat provisoire" icon={Clock3} />
        <ReportStat value="2027" label="congrès à Zoboroma" icon={Flag} />
      </section>

      <section className="vj-enter grid gap-7 lg:grid-cols-[1fr_.72fr]">
        <div className="rounded-[28px] border border-border bg-card p-6 shadow-sm sm:p-8">
          <p className="font-mono text-[9px] font-bold uppercase tracking-[.18em] text-primary">
            Décision de l’Assemblée générale
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-[-.04em] sm:text-4xl">
            Le Comité provisoire est validé.
          </h2>
          <p className="mt-5 text-sm leading-7 text-foreground/75">
            Après la présentation de ses membres, de leurs responsabilités et de
            leurs missions, l’Assemblée générale a validé le Comité provisoire
            et lui a réaffirmé son soutien. Cette décision marque le démarrage
            effectif de ses activités.
          </p>
          <div className="mt-6 rounded-2xl border border-secondary/20 bg-secondary/8 p-5">
            <CheckCircle2 className="h-6 w-6 text-secondary" />
            <p className="mt-3 text-sm font-extrabold leading-6">
              Le comité travaillera dans un esprit de responsabilité, de
              transparence, de collaboration et d’implication collective.
            </p>
          </div>
        </div>

        <blockquote className="relative overflow-hidden rounded-[28px] bg-primary p-7 text-primary-foreground shadow-sm sm:p-8">
          <Sparkles className="h-7 w-7 text-accent" />
          <p className="vj-display mt-6 text-3xl leading-tight sm:text-4xl">
            « Passer des préoccupations aux priorités, des priorités aux projets
            et des projets aux réalisations concrètes. »
          </p>
          <footer className="mt-6 font-mono text-[9px] font-bold uppercase tracking-[.18em] text-primary-foreground/65">
            Principe directeur
          </footer>
        </blockquote>
      </section>

      <section className="rounded-[28px] border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex items-start gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            <ListChecks className="h-5 w-5" />
          </span>
          <div>
            <p className="font-mono text-[9px] font-bold uppercase tracking-[.18em] text-primary">
              Feuille de route
            </p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-[-.035em] sm:text-3xl">
              Les sept axes de la mission
            </h2>
          </div>
        </div>
        <ol className="mt-7 grid gap-3 md:grid-cols-2">
          {mission.map((item, index) => (
            <li
              key={item}
              className="flex gap-4 rounded-2xl bg-muted/55 p-4 text-sm leading-6 text-foreground/75"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-background font-mono text-[10px] font-bold text-primary shadow-sm">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-5">
        <div>
          <p className="font-mono text-[9px] font-bold uppercase tracking-[.18em] text-secondary">
            Organisation
          </p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-[-.04em]">
            Les membres présentés à l’Assemblée
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
            Sept responsables assurent les fonctions centrales et huit
            coordinateurs relaient les activités dans leurs zones respectives.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <TeamList title="Fonctions centrales" people={centralTeam} />
          <TeamList title="Coordination des zones" people={zoneCoordinators} />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_.8fr]">
        <div className="rounded-[28px] border border-border bg-card p-6 shadow-sm sm:p-8">
          <p className="font-mono text-[9px] font-bold uppercase tracking-[.18em] text-primary">
            À approfondir
          </p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-[-.035em]">
            Les questions inscrites pour les prochaines réunions
          </h2>
          <ul className="mt-6 space-y-3">
            {nextQuestions.map((question) => (
              <li
                key={question}
                className="flex gap-3 text-sm leading-6 text-foreground/75"
              >
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                {question}
              </li>
            ))}
          </ul>
          <p className="mt-6 rounded-2xl bg-accent/25 p-4 text-xs font-semibold leading-6 text-foreground/70">
            Ces sujets n’ont pas été rejetés. Leur examen détaillé a été reporté
            pour respecter l’objectif principal de cette première Assemblée
            générale.
          </p>
        </div>

        <div className="rounded-[28px] bg-secondary p-7 text-secondary-foreground shadow-sm sm:p-8">
          <CalendarDays className="h-7 w-7 text-accent" />
          <p className="mt-6 font-mono text-[9px] font-bold uppercase tracking-[.18em] text-secondary-foreground/65">
            Prochaine échéance
          </p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-[-.04em]">
            Congrès en septembre 2027
          </h2>
          <p className="mt-4 text-sm leading-7 text-secondary-foreground/75">
            À la fin du mandat provisoire d’un an, un congrès est prévu à
            Zoboroma pour élire le bureau appelé à succéder au Comité
            provisoire.
          </p>
        </div>
      </section>

      <section className="rounded-[28px] border border-border bg-card px-6 py-8 text-center shadow-sm sm:px-10 sm:py-10">
        <p className="vj-display mx-auto max-w-3xl text-3xl leading-tight sm:text-4xl">
          Une organisation responsable, opérationnelle et orientée vers les
          résultats.
        </p>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
          Compte rendu établi par Barrè Béavogui, responsable du rapportage et
          de la documentation, et Gbadé Koivogui, coordinateur général.
        </p>
        <a
          href={reportPdfUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-full bg-foreground px-5 py-3 text-xs font-extrabold text-background transition hover:-translate-y-0.5"
        >
          <FileText className="h-4 w-4" /> Consulter le document officiel
        </a>
      </section>
    </article>
  );
}

function ReportStat({
  value,
  label,
  icon: Icon,
}: {
  value: string;
  label: string;
  icon: typeof Users;
}) {
  return (
    <div className="vj-enter rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <strong className="vj-display text-4xl font-normal text-primary">
          {value}
        </strong>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="mt-2 text-xs font-bold text-muted-foreground">{label}</p>
    </div>
  );
}

function TeamList({ title, people }: { title: string; people: string[][] }) {
  return (
    <div className="overflow-hidden rounded-[26px] border border-border bg-card shadow-sm">
      <h3 className="bg-foreground px-5 py-4 text-sm font-extrabold text-background sm:px-6">
        {title}
      </h3>
      <ul className="divide-y divide-border">
        {people.map(([name, role], index) => (
          <li key={`${name}-${role}`} className="flex gap-4 px-5 py-4 sm:px-6">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 font-mono text-[9px] font-bold text-primary">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div>
              <p className="text-sm font-extrabold">{name}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {role}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
