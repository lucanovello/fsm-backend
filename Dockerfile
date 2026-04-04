# ---- Base ----
ARG NODE_VERSION=20.19.0
ARG ALPINE_VERSION=3.20
ARG GCOMPAT_VERSION=1.1.0-r4

FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS base
WORKDIR /app
ARG GCOMPAT_VERSION
RUN apk add --no-cache "gcompat=${GCOMPAT_VERSION}"

# ---- Prod deps ----
FROM base AS prod-deps
ENV NODE_ENV=production
ENV DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fsm_backend?schema=public
COPY package*.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci --omit=dev --ignore-scripts \
  && npx prisma generate

# ---- Build ----
# Install dev deps for building, then compile
FROM base AS build
ENV NODE_ENV=development
# Dummy DB URL required by Prisma at build time; actual DB URL is injected at runtime
ENV DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fsm_backend?schema=public
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY .  .
RUN npx prisma generate && npm run build

# ---- Runtime ----
FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS runner
WORKDIR /app
ENV NODE_ENV=production
ARG GCOMPAT_VERSION

# Pull in latest security fixes for Alpine packages (e.g. OpenSSL).
RUN apk upgrade --no-cache \
  && apk add --no-cache "gcompat=${GCOMPAT_VERSION}"

# The runtime image doesn't need npm/npx. Removing them reduces attack surface
# and avoids Node.js ecosystem CVEs that only affect the package manager.
RUN addgroup -S app && adduser -S app -G app
RUN rm -rf /usr/local/lib/node_modules/npm \
  && rm -f /usr/local/bin/npm /usr/local/bin/npx

COPY --chown=app:app --from=build /app/dist ./dist
COPY --chown=app:app --from=prod-deps /app/node_modules ./node_modules
COPY --chown=app:app package*.json ./
COPY --chown=app:app prisma.config.ts ./
COPY --chown=app:app prisma ./prisma

USER app

EXPOSE 3000
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && node dist/index.js"]
