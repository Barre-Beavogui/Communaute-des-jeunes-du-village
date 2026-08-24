# Village Jeunes

Une communauté privée où les jeunes du village peuvent se présenter, découvrir les autres membres et partager leurs projets.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/village-jeunes` — application React/Vite, navigation et écrans communautaires.
- `lib/api-spec/openapi.yaml` — contrat source des profils, du résumé communautaire et de la modération.
- `artifacts/api-server/src/routes` — routes Express branchées sur PostgreSQL.
- `lib/db/src/schema/members.ts` — tables `profiles` et `membership_requests`.

## Architecture decisions

- Le profil courant est provisoirement identifié par `mina` pour rendre la première version démontrable ; remplacer ce point par l’identité Clerk/Replit avant une mise en production multi-utilisateur.
- Les informations de contact sont soumises à un choix de visibilité `community` ou `private`.
- Les profils publics sont limités aux membres dont le statut est `approved`.
- Le contrat OpenAPI reste la source unique avant toute modification d’API ou de hooks.

## Product

- Annuaire filtrable et recherche de membres.
- Profils individuels avec bio, activités, projet, contact et réglage de confidentialité.
- Formulaire de demande d’adhésion et file de modération admin.
- Résumé de la vie de la communauté avec membres, projets et activités partagées.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Après chaque changement dans `lib/api-spec/openapi.yaml`, lancer `pnpm --filter @workspace/api-spec run codegen`.
- La version Zod actuellement installée génère mal les raccourcis `zod.int()` ; les champs numériques du contrat utilisent donc `type: number` avec contraintes explicites.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
