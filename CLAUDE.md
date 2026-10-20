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

No test runner is configured. If tests are added, wire the runner into `package.json` scripts.

## Architecture

SvelteKit 2 + Svelte 5 app: a single projects page (`src/routes/+page.svelte`) with interactive isometric drawings (`src/lib/components/Anatomy.svelte`, `src/lib/figures/`, `src/lib/iso/`). The pieces that constrain future code:

- **Projects live in SQLite** (`better-sqlite3` + Drizzle, `src/lib/server/db/`, `DATABASE_URL`, default `local.db`). Migrations in `drizzle/` (`pnpm drizzle-kit generate` after a schema change) run at start; an empty database is seeded from `PROJECTS` in `src/lib/projects.ts`. A project's picture is `art` (a hand-drawn figure/illustration in `+page.svelte`, listed in `ARTS`) or else `image` (a URL).
- **`/admin`** edits projects (anchors are slugs of the name, fixed once created). `src/hooks.server.ts` runs Clerk on every route but `/api/health`, sets `locals.isAdmin` (Clerk `privateMetadata.role === 'admin'` with `scope` including `tools`, same Clerk instance as jrg-life) for the header, and re-checks it uncached for `/admin` and its actions.
- **Runes mode is forced.** `vite.config.ts` sets `compilerOptions.runes` to `true` for every file outside `node_modules`. Legacy reactive syntax (`export let`, `$:`) will not compile in this project — use `$props()`, `$state()`, `$derived()`.
- **Adapter is `adapter-node` 5.x** (6.x needs SvelteKit 3). `pnpm build` writes a standalone server to `build/`; the `Dockerfile` runs `node build/index.js` on port 80. `.github/workflows/publish-docker.yaml` pushes the image to `ghcr.io/jrg-tools/jrg.tools` on `main` and `v*` tags, then triggers the Dokploy deploy (secrets `DOKPLOY_TOKEN`, `DOKPLOY_APPLICATION_ID`).
- **Tailwind v4, CSS-first.** No `tailwind.config.js`; configuration goes in `src/routes/layout.css` (`@import 'tailwindcss'`), which is imported by `src/routes/+layout.svelte`. `prettier.config.js` points `tailwindStylesheet` at that same file for class sorting — keep them in sync if the stylesheet moves.
- **`$lib` alias** maps to `src/lib`. Path aliases are configured in SvelteKit config, not `tsconfig.json`.

## Conventions

- Prettier: tabs, single quotes, no trailing commas, 100 columns. ESLint extends `eslint-config-prettier`, so formatting is Prettier's job alone.
- ESLint derives its ignore list from `.gitignore` (`includeIgnoreFile`), so ignoring a path there also removes it from linting.
- `.prettierignore` skips `/static/` and `src/lib/iso/` (the iso kit is vendored from the anatomy skill).
