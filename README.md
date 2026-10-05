# Zoboroma Jeunes

Site de la communauté des jeunes de Zoboroma : inscription, espace membre
(annuaire, profils, actualités, sondages, discussion de groupe) et espace
d’administration.

## Organisation du dépôt

- `artifacts/village-jeunes` : le site (React + Vite + Tailwind). Les pages
  sont dans `src/pages`, les routes dans `src/App.tsx`.
- `artifacts/api-server` : l’API (Express 5) branchée sur PostgreSQL (Neon).
  Les routes sont dans `src/routes`.
- `lib/api-spec/openapi.yaml` : le contrat de l’API. Après chaque changement,
  lancer `pnpm --filter @workspace/api-spec run codegen`.
- `lib/db/src/schema` : les tables (Drizzle). Les nouvelles colonnes sont
  aussi ajoutées au démarrage dans
  `artifacts/api-server/src/data/sync-zoboroma-members.ts`.

## Commandes utiles

- `pnpm install` : installer les dépendances (pnpm uniquement).
- `pnpm run typecheck` : vérifier tout le code.
- `pnpm run build:pages` : construire le site.
- `pnpm run build:api` : construire l’API.

## Publication

- Chaque fusion dans `main` publie le site sur GitHub Pages
  (`.github/workflows/deploy-pages.yml`), domaine zoboroma.online.
- L’API est hébergée sur Vercel (`artifacts/api-server/vercel.json`).
  `render.yaml` et `Dockerfile` restent disponibles pour un hébergement
  sur Render.
- Chaque demande de modification est vérifiée automatiquement
  (`.github/workflows/verification.yml`) avant la fusion.

## Règles

- Toujours travailler sur une branche et passer par une demande de
  modification, jamais directement sur `main`.
- Ne jamais ajouter au dépôt de fichier contenant des données personnelles
  (exports Excel ou CSV du recensement, numéros de téléphone, emails).
  Le dépôt est public.
- Les secrets (`DATABASE_URL`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`,
  `MEMBER_SESSION_SECRET`) se règlent uniquement dans Vercel ou Render,
  jamais dans le code.
