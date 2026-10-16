# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager is **pnpm** (`engine-strict=true` in `.npmrc`; `pnpm-workspace.yaml` allows the `esbuild` build script).

```sh
pnpm dev              # vite dev server
pnpm build            # production build
pnpm preview          # serve the production build
pnpm check            # svelte-kit sync + svelte-check (type checking)
pnpm check:watch      # same, in watch mode
pnpm lint             # prettier --check . && eslint .
pnpm format           # prettier --write .
```

Database (Drizzle Kit, reads `DATABASE_URL` from the environment — `drizzle.config.ts` throws if unset):

```sh
pnpm db:push          # push schema straight to the DB (no migration files)
pnpm db:generate      # generate migration SQL into ./drizzle
pnpm db:migrate       # apply generated migrations
pnpm db:studio        # Drizzle Studio UI
```

No test runner is configured. If tests are added, wire the runner into `package.json` scripts.

## Architecture

SvelteKit 2 + Svelte 5 app, currently a bare scaffold (`src/routes/+page.svelte` is still the starter page). The pieces that constrain future code:

- **Runes mode is forced.** `vite.config.ts` sets `compilerOptions.runes` to `true` for every file outside `node_modules`. Legacy reactive syntax (`export let`, `$:`) will not compile in this project — use `$props()`, `$state()`, `$derived()`.
- **Adapter is `adapter-node` 5.x** (6.x needs SvelteKit 3). `pnpm build` writes a standalone server to `build/`; the `Dockerfile` runs `node build/index.js` on port 80. `.github/workflows/publish-docker.yaml` pushes the image to `ghcr.io/jrg-tools/jrg.tools` on `main` and `v*` tags, then triggers the Dokploy deploy (secrets `DOKPLOY_TOKEN`, `DOKPLOY_APPLICATION_ID`).
- **Database access is server-only.** `src/lib/server/db/index.ts` exports a singleton `db` (Drizzle over `@libsql/client`) and reads `DATABASE_URL` via `$env/dynamic/private`, so it can only be imported from server code (`+page.server.ts`, `+server.ts`, `src/lib/server/**`). Schema lives in `src/lib/server/db/schema.ts` and is the single source drizzle-kit reads.
- **Tailwind v4, CSS-first.** No `tailwind.config.js`; configuration goes in `src/routes/layout.css` (`@import 'tailwindcss'`), which is imported by `src/routes/+layout.svelte`. `prettier.config.js` points `tailwindStylesheet` at that same file for class sorting — keep them in sync if the stylesheet moves.
- **`$lib` alias** maps to `src/lib`. Path aliases are configured in SvelteKit config, not `tsconfig.json`.

## Conventions

- Prettier: tabs, single quotes, no trailing commas, 100 columns. ESLint extends `eslint-config-prettier`, so formatting is Prettier's job alone.
- ESLint derives its ignore list from `.gitignore` (`includeIgnoreFile`), so ignoring a path there also removes it from linting.
- `.gitignore` excludes `/static/` and `/drizzle/` — generated migrations and static assets are not tracked. Verify this is intended before relying on migration files being present for a teammate or a deploy.
