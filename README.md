# FSM Backend

[![CI](https://github.com/lucanovello/fsm-backend/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/lucanovello/fsm-backend/actions/workflows/ci.yml)

Backend API for a small Field Service Management (FSM) app: customers, service locations, technicians, and work orders.

- API contracts (draft): [`docs/api-contracts-v0.md`](./docs/api-contracts-v0.md)
- Ops runbook: [`docs/ops/runbook.md`](./docs/ops/runbook.md)

## Tech

- Node.js 20 + TypeScript
- Express
- Prisma + Postgres
- Redis (shared rate limiting; required in production)
- JWT auth (access + rotating refresh tokens)
- Vitest

## What’s included

- Auth lifecycle: register, login, refresh, logout, password reset, email verification
- Session tracking (Postgres)
- Basic RBAC (`USER`, `ADMIN`)
- Rate limiting + login lockout (Redis-backed in production; in-memory fallback for local dev)
- Health + readiness probes
- Build metadata endpoint
- OpenAPI spec + Swagger UI (non-production)
- Optional Prometheus metrics endpoint (guarded)

## Local setup

**Requirements**

- Node 20.x (see [`.nvmrc`](./.nvmrc))
- Docker (for Postgres; optional Redis)

1. Configure env:

```bash
cp .env.example .env
```

2. Start Postgres:

```bash
docker compose up -d db
```

Optional: start Redis too (for Redis-backed rate limiting):

```bash
docker compose up -d redis
```

3. Install deps, generate Prisma client, run migrations:

```bash
npm install
npx prisma generate
npx prisma migrate deploy
```

4. Run the API:

```bash
npm run dev
```

Optional: run everything via Docker Compose (API + Postgres + Redis):

```bash
docker compose --profile dev-app up
```

## Seed sample data (dev)

The seed script wipes and repopulates FSM domain tables (customers/locations/technicians/work-orders/notes/line-items). It refuses to run in production and requires an explicit opt-in.

```bash
ALLOW_DB_SEED=true npm run db:seed
```

Optional: override the seed password:

```bash
ALLOW_DB_SEED=true SEED_PASSWORD="your-dev-password" npm run db:seed
```

Seeded accounts (from [`prisma/seed.ts`](./prisma/seed.ts)):

- `admin@example.com`
- `tech1@example.com`
- `tech2@example.com`

## Testing

1. Start Postgres and create the test env file:

```bash
docker compose up -d db
cp .env.test.example .env.test
```

2. Ensure a local test database exists (tests enforce “localhost” and a DB name ending in `_test`):

```bash
docker compose exec db psql -U postgres -c "CREATE DATABASE fsm_backend_test;"
```

3. Run tests:

```bash
npm test
```

Note: the test runner prepares the DB by running `npx prisma migrate reset --force` against `DATABASE_URL` (auto-adjusting the DB name to end with `_test` if needed).

Coverage:

```bash
npm run test:ci
```

## Useful endpoints

- `GET /health` → liveness (`{ "status": "ok" }`)
- `GET /ready` → readiness (checks DB; may return 503)
- `GET /version` → build metadata
- `GET /openapi.json` → OpenAPI document
- `GET /docs` → Swagger UI (only when `NODE_ENV !== "production"`)
- `GET /metrics` → Prometheus metrics (enabled when non-production or when explicitly enabled in config)
- `POST /auth/*` → authentication lifecycle (register/login/refresh/logout/password reset/email verification)
- `GET /api/*` → FSM endpoints (all require auth)

## License

MIT — see [`LICENSE`](./LICENSE).
