# syntax=docker/dockerfile:1

# Debian (glibc) + Node 26. Node 25+ no longer ships corepack, so pnpm is installed
# at the version pinned in `packageManager` (keep the two in sync).
FROM node:26-bookworm-slim AS base
WORKDIR /app
RUN npm install -g pnpm@11.13.1
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./

FROM base AS build
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
	pnpm install --frozen-lockfile --store-dir /pnpm/store
COPY . .
# SvelteKit 3 validates the variables in src/env.ts while building: placeholders, never inlined.
RUN DATABASE_URL=:memory: \
	CLERK_SECRET_KEY=build-placeholder \
	PUBLIC_CLERK_PUBLISHABLE_KEY=build-placeholder \
	pnpm run build

# adapter-node bundles `devDependencies`; only the native better-sqlite3 is installed here.
FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
	pnpm install --frozen-lockfile --prod --store-dir /pnpm/store \
	&& mkdir -p /app/db

FROM node:26-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
	PORT=80 \
	HOST=0.0.0.0 \
	DATABASE_URL=/app/db/jrg-tools.db

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/build ./build
# Migrations are applied by the app at start (src/lib/server/db/index.ts reads ./drizzle).
COPY drizzle ./drizzle
COPY package.json ./

# The database is never in the image: it lives on this volume.
COPY --from=prod-deps --chown=node:node /app/db ./db
VOLUME ["/app/db"]

EXPOSE 80
CMD ["build/index.js"]
