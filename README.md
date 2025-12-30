# FSM Backend Application

[![CI](https://github.com/lucanovello/fsm-backend/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/lucanovello/fsm-backend/actions/workflows/ci.yml)

Backend API for a **Field Service Management (FSM)** platform. This repo started from an Express/Prisma/JWT foundation and is being refit into an FSM domain backend (Customers, Service Locations, Technicians, Work Orders, Work Notes, etc.).

- Domain plan: see [`docs/domain-model.md`](./docs/domain-model.md)
- Product/engineering plan: see `docs/PROJECT-OVERVIEW.md` (and/or your GitHub Project board)

---

## Features (current foundation)

- **Auth**: access/refresh JWT + rotation
- **Sessions**: Prisma/Postgres-backed sessions
- **Logging**: Pino structured logs with `x-request-id`
- **Health**: liveness `/health` and readiness `/ready`
- **Docs**: OpenAPI at `/openapi.json` + Swagger UI at `/docs` (non-prod)
- **CI**: typecheck + lint + Vitest + coverage artifact + container vulnerability scanning
- **Optional**: Prometheus metrics endpoint `/metrics` (guarded; off by default in prod)

---

## Table of Contents

- [Quickstart (local dev)](#quickstart-local-dev)
- [Environment files](#environment-files)
- [Testing](#testing)
- [API docs](#api-docs)
- [Health checks](#health-checks)
- [Roles & admin bootstrapping](#roles--admin-bootstrapping)
- [Run in Docker (prod-like)](#run-in-docker-prod-like)
- [Observability (optional)](#observability-optional)
- [License](#license)

---

## Quickstart (local dev)

**Requirements**

- Node **20.x** (see `.nvmrc`)
- Docker (for Postgres)

```bash
cp .env.example .env
nvm use        # optional (reads .nvmrc)
npm install

docker compose up -d db
npx prisma generate
npx prisma migrate deploy

npm run dev
# GET http://localhost:3000/health -> {"status":"ok"}
```

## Seeding the DB (dev)

This repo includes a Prisma seed script that populates the dev database with sample FSM data:

- admin user + technician user
- technicians
- customers + service locations
- work orders with varied statuses/priorities
- work notes + line items

### Run seed

1. Start Postgres:

```bash
docker compose up -d db
```

2. Apply migrations:

```bash
npx prisma migrate deploy
```

3. Seed:

```bash
npm run db:seed
```

### Seeded login accounts

- admin@example.com
- tech@example.com

**Password**:

- defaults to ChangeMe123!
- override via:

```bash
SEED_PASSWORD="MyNewDevPass123!" npm run db:seed
```

Note: The seed script is intended for local dev only and will wipe FSM domain tables before re-inserting sample data.

---

## 4) Verify locally (don’t skip this)

### A) Run it end-to-end

```bash
docker compose up -d db
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate deploy
npm run db:seed
```

### B) Inspect quickly with Prisma Studio

```bash
npx prisma studio
```

Confirm you see:

- Users
- Technician linked to the tech user
- Customers + locations
- WorkOrders with statuses like DRAFT/SCHEDULED/IN_PROGRESS/COMPLETED
- Notes + line items linked correctly

**All-in-one compose (API + Postgres + Redis for dev)**

```bash
docker compose --profile dev-app up
```

---

## Environment files

This repo uses stage-specific env files. Copy the examples and replace placeholders **before any non-local deployment**.

- `.env.example` → `.env` (local dev)
- `.env.test.example` → `.env.test` (tests/CI)
- `.env.production.example` → `.env.production` (prod / `compose.prod.yml`)

### Naming consistency note

This repo previously had leftover template naming (`starter`, `starter_test`). The intended naming going forward is:

- Dev DB: `fsm_backend`
- Test DB: `fsm_backend_test`

If your Docker compose currently uses `fsm-backend` (hyphen), consider switching to `fsm_backend` (underscore) for fewer Postgres edge cases and consistency across env/CI.

---

## Testing

Start Postgres first:

```bash
docker compose up -d db
cp .env.test.example .env.test
```

Run tests:

```bash
npm test
```

Coverage:

```bash
npm run test:cov
```

Full check suite:

```bash
npm run check
```

### Test database

Tests expect a **local** DB ending in `_test` (guarded to prevent accidental data loss). If you need to create it manually:

```bash
docker compose up -d db
docker compose exec db psql -U postgres -c "CREATE DATABASE fsm_backend_test;"
```

---

## API docs

- Raw OpenAPI: `GET /openapi.json`
- Swagger UI: `GET /docs` (non-production environments)

Regenerate OpenAPI locally (writes `./openapi.json`):

```bash
npm run build
node scripts/generate-openapi.mjs
```

---

## Health checks

- `GET /health` → `200 {"status":"ok"}`
- `GET /ready` → `200 {"status":"ready"}` when dependencies respond
  Otherwise returns `503` with an error code (e.g. DB/Redis not ready).

---

## Roles & admin bootstrapping

Default roles:

- `USER`
- `ADMIN`

### Create a user (dev)

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"ChangeMe123!"}'
```

### Promote to ADMIN (CLI)

```bash
npm run user:set-role -- --email admin@example.com --role ADMIN
# or:
npm run bootstrap:first-admin -- --email admin@example.com
```

> These scripts are meant for bootstrapping. As the FSM app grows, admin management should move into a real admin workflow/UI.

---

## Run in Docker (prod-like)

### Option A: Docker Compose (recommended)

```bash
cp .env.production.example .env.production
# edit .env.production with strong secrets
docker compose --env-file .env.production -f compose.prod.yml up -d --build
```

Notes:

- The container boot runs `prisma migrate deploy` before starting the server.
- In production, configure **CORS allowlist**, **JWT secrets**, **DB credentials**, and **Redis** for rate limiting.

### Option B: Build & run container directly

```bash
docker build -t fsm-backend-api .
docker run --rm -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  -e JWT_ACCESS_SECRET=... \
  -e JWT_REFRESH_SECRET=... \
  fsm-backend-api
```

---

## Observability (optional)

- Prometheus metrics: `GET /metrics`
  - Keep **disabled in prod** unless guarded (shared secret header or CIDR allowlist) and protected at the network/ingress layer.

- Logs: Pino JSON logs include `x-request-id` for tracing.

---

## License

MIT — see [`LICENSE`](./LICENSE).
