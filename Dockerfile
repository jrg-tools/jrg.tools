# syntax=docker/dockerfile:1

# Debian (glibc) + Node 26, pnpm from `packageManager` via corepack (as in jrg-life).
FROM node:26-bookworm-slim AS base
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./

FROM base AS build
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
	pnpm install --frozen-lockfile --store-dir /pnpm/store
COPY . .
# The build loads the server code, which opens the database: a throwaway one in memory.
RUN DATABASE_URL=:memory: pnpm run build

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

# Non-root like jrg-life; Docker lets unprivileged users bind port 80 inside the container.
USER node
EXPOSE 80
CMD ["build/index.js"]
