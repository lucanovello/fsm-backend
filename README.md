# FSM Backend

[![CI](https://github.com/lucanovello/fsm-backend/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/lucanovello/fsm-backend/actions/workflows/ci.yml)

Backend API for a small Field Service Management (FSM) app: customers, service locations, technicians, and work orders.

- Domain notes: [`docs/domain-model.md`](./docs/domain-model.md)
- Product notes: [`docs/PROJECT-OVERVIEW.md`](./docs/PROJECT-OVERVIEW.md)

## Tech

- Node.js 20 + TypeScript
- Express
- Prisma + Postgres
- JWT auth (access + rotating refresh tokens)
- Vitest

## What’s included

- Auth lifecycle: register, login, refresh, logout, password reset, email verification
- Session tracking (Postgres)
- Basic RBAC (`USER`, `ADMIN`)
- Health + readiness probes
- Build metadata endpoint
- OpenAPI spec + Swagger UI (non-production)
- Optional Prometheus metrics endpoint (guarded)

## Local setup

**Requirements**

- Node 20.x (see [`.nvmrc`](./.nvmrc))
- Docker (for Postgres)

1. Configure env:

```bash
cp .env.example .env
```

2. Start Postgres:

```bash
docker compose up -d db
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

Coverage:

```bash
npm run test:cov
```

## Useful endpoints

- `GET /health` → liveness (`{ "status": "ok" }`)
- `GET /ready` → readiness (checks DB; may return 503)
- `GET /version` → build metadata
- `GET /openapi.json` → OpenAPI document
- `GET /docs` → Swagger UI (only when `NODE_ENV !== "production"`)
- `GET /metrics` → Prometheus metrics (enabled when non-production or when explicitly enabled in config)

## License

MIT — see [`LICENSE`](./LICENSE).
