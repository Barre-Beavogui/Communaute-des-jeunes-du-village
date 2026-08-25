import {
  ArrowRight,
  BookOpenText,
  CalendarDays,
  Leaf,
  MapPinned,
  Megaphone,
  Sprout,
  UsersRound,
} from "lucide-react";
import { Link } from "wouter";
import {
  getGetMembersSummaryQueryKey,
  useGetMembersSummary,
} from "@workspace/api-client-react";
import { RotatingWords } from "@/components/rotating-words";

const stories = [
  {
    date: "24 août 2026",
    category: "Communauté",
    title: "Le recensement numérique est ouvert",
    description:
      "Les jeunes de Zoboroma peuvent désormais présenter leur parcours, leur activité et leurs projets dans un annuaire commun.",
    icon: Megaphone,
  },
  {
    date: "En cours",
    category: "Mémoire",
    title: "Construisons les archives du village",
    description:
      "Photos anciennes, récits, traditions et souvenirs peuvent enrichir cette page. La parole des familles donnera vie à cette mémoire.",
    icon: BookOpenText,
  },
  {
    date: "Appel à idées",
    category: "Initiatives",
    title: "Faisons connaître les projets des jeunes",
    description:
      "Agriculture, études, entrepreneuriat, culture ou solidarité : chaque initiative peut inspirer une nouvelle collaboration.",
    icon: Sprout,
  },
];

export default function ZoboromaPage() {
  const summaryQuery = useGetMembersSummary({
    query: { queryKey: getGetMembersSummaryQueryKey() },
  });
  const memberCount = summaryQuery.data?.totalMembers ?? 21;

  return (
    <div className="space-y-9">
      <section className="vj-enter relative overflow-hidden rounded-[30px] bg-secondary px-6 py-10 text-secondary-foreground sm:px-10 sm:py-14 lg:px-14 lg:py-16">
        <div className="vj-orbit-slow absolute -right-20 -top-20 h-72 w-72 rounded-full border-[38px] border-accent/35" />
        <div className="vj-drift absolute bottom-[-6rem] left-1/2 h-52 w-52 rounded-full bg-foreground/20 blur-3xl" />
        <div className="relative max-w-3xl">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[.2em] text-accent">
            Guinée forestière · Préfecture de Macenta
          </p>
          <h1 className="vj-display mt-4 text-[clamp(3.8rem,9vw,7.5rem)] leading-[.84] tracking-[-.06em]">
            <span className="sr-only">Zoboroma, notre lien.</span>
            <span aria-hidden="true">
              Zoboroma,
              <br />
              <em className="text-accent">
                notre{" "}
                <RotatingWords
                  words={["lien", "mémoire", "avenir"]}
                  interval={2800}
                  minWidth="6.4ch"
                />
                .
              </em>
            </span>
          </h1>
          <p className="mt-7 max-w-xl text-sm leading-7 text-secondary-foreground/78 sm:text-base">
            Une page pour raconter le village, préserver sa mémoire et mettre en
            lumière celles et ceux qui construisent son avenir, à Zoboroma et
            ailleurs.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#actualites"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-xs font-extrabold text-accent-foreground"
            >
              Voir les actualités <ArrowRight className="h-4 w-4" />
            </a>
            <Link
              href="/membres"
              className="inline-flex items-center gap-2 rounded-full border border-secondary-foreground/25 px-5 py-3 text-xs font-extrabold"
            >
              {memberCount} parcours recensés
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
        <div className="rounded-[26px] border border-border bg-card p-6 shadow-sm sm:p-9">
          <MapPinned className="h-7 w-7 text-primary" />
          <p className="mt-7 font-mono text-[10px] font-bold uppercase tracking-[.18em] text-primary">
            Au cœur de la Guinée forestière
          </p>
          <h2 className="vj-display mt-3 text-5xl leading-[.92]">
            Un village proche de la forêt de Ziama.
          </h2>
          <p className="mt-5 text-sm leading-7 text-muted-foreground">
            Zoboroma se trouve dans la préfecture de Macenta, dans la région de
            Nzérékoré. Le village est situé aux abords de la forêt classée de
            Ziama, un paysage majeur de la Guinée forestière.
          </p>
          <a
            href="https://mru.int/wp-content/uploads/2020/04/RBZ-rev.pdf"
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline"
          >
            Consulter le plan de la réserve de Ziama
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
        <div className="rounded-[26px] bg-foreground p-6 text-background sm:p-9">
          <Leaf className="h-7 w-7 text-accent" />
          <p className="mt-7 font-mono text-[10px] font-bold uppercase tracking-[.18em] text-accent">
            Un patrimoine vivant
          </p>
          <p className="mt-3 text-6xl font-extrabold tracking-[-.08em]">124</p>
          <p className="mt-1 text-sm font-bold">espèces végétales utiles</p>
          <p className="mt-5 text-sm leading-7 text-background/68">
            Une étude consacrée aux forêts humides de Guinée a recensé à
            Zoboroma 124 espèces réparties dans 44 familles botaniques, signe
            d’une diversité remarquable.
          </p>
          <a
            href="https://horizon.documentation.ird.fr/exl-doc/pleins_textes/2022-05/010084795.pdf"
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-accent hover:underline"
          >
            Lire l’étude publiée par l’IRD
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          [
            UsersRound,
            "Relier les générations",
            "Faire circuler les expériences entre les jeunes, les familles et les aînés.",
          ],
          [
            BookOpenText,
            "Préserver la mémoire",
            "Rassembler progressivement les récits, les images et les repères du village.",
          ],
          [
            Sprout,
            "Faire grandir les projets",
            "Donner de la visibilité aux compétences et aux initiatives de la communauté.",
          ],
        ].map(([Icon, title, description]) => {
          const FeatureIcon = Icon as typeof UsersRound;
          return (
            <article
              key={title as string}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <FeatureIcon className="h-5 w-5 text-secondary" />
              <h3 className="mt-5 text-base font-extrabold tracking-[-.03em]">
                {title as string}
              </h3>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">
                {description as string}
              </p>
            </article>
          );
        })}
      </section>

      <section id="actualites" className="scroll-mt-28 space-y-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[.18em] text-primary">
              Le carnet du village
            </p>
            <h2 className="vj-display mt-2 text-5xl leading-none">
              Actualités de Zoboroma.
            </h2>
          </div>
          <p className="max-w-sm text-xs leading-6 text-muted-foreground">
            Cette rubrique grandira avec les annonces, les réussites et les
            histoires proposées par la communauté.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {stories.map((story, index) => {
            const Icon = story.icon;
            return (
              <article
                key={story.title}
                className={`group rounded-[24px] border p-6 ${index === 0 ? "border-primary/30 bg-primary text-primary-foreground" : "border-border bg-card"}`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`grid h-10 w-10 place-items-center rounded-xl ${index === 0 ? "bg-primary-foreground/15" : "bg-muted text-primary"}`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-wider ${index === 0 ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}
                  >
                    {story.category}
                  </span>
                </div>
                <p
                  className={`mt-7 flex items-center gap-1.5 text-[10px] font-bold ${index === 0 ? "text-primary-foreground/65" : "text-muted-foreground"}`}
                >
                  <CalendarDays className="h-3.5 w-3.5" /> {story.date}
                </p>
                <h3 className="mt-3 text-xl font-extrabold tracking-[-.04em]">
                  {story.title}
                </h3>
                <p
                  className={`mt-3 text-sm leading-6 ${index === 0 ? "text-primary-foreground/76" : "text-muted-foreground"}`}
                >
                  {story.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col justify-between gap-6 rounded-[26px] bg-accent px-6 py-8 sm:flex-row sm:items-center sm:px-9">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[.18em] text-accent-foreground/60">
            Écrivons la suite ensemble
          </p>
          <h2 className="vj-display mt-2 text-4xl leading-none">
            Votre histoire a sa place ici.
          </h2>
        </div>
        <Link
          href="/actualites"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3 text-xs font-bold text-background"
        >
          Participer aux actualités <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
