# API contracts (v0)

This document is a human-readable summary. The source of truth is the generated OpenAPI document
served at `GET /openapi.json` (and `GET /docs` in non-production).

## Conventions

- **Auth**: Most endpoints require `Authorization: Bearer <token>`.
- **Org context**: Most `/api/*` endpoints use `x-org-id` to select the org. If a user belongs to
  multiple orgs and no header is provided, the API responds with `ORG_REQUIRED`.
- **Errors**: JSON envelope `{ "error": { "message", "code", "details"? } }`.

## Operational

- `GET /health`
- `GET /ready`
- `GET /version`
- `GET /metrics` (guarded; uses `x-metrics-secret` when configured)
- `GET /openapi.json`
- `GET /docs` (non-production only)

## Auth

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/logout-all`
- `POST /auth/verify-email`
- `POST /auth/request-password-reset`
- `POST /auth/reset-password`
- `GET /auth/sessions`

## Protected (RBAC)

- `GET /protected/admin/ping`
- `GET /protected/users/:userId`

## Organizations

- `GET /api/organizations`
- `POST /api/organizations`

## Customers

- `GET /api/customers`
- `GET /api/customers/:id`

## Service locations

- `GET /api/service-locations`
- `POST /api/service-locations`
- `GET /api/service-locations/:id`
- `PATCH /api/service-locations/:id`
- `DELETE /api/service-locations/:id`

## Technicians

- `GET /api/technicians`

## Service resources

- `GET /api/service-resources`
- `POST /api/service-resources`
- `GET /api/service-resources/:id`
- `PATCH /api/service-resources/:id`
- `DELETE /api/service-resources/:id`
- `GET /api/service-resources/:id/skills`
- `PUT /api/service-resources/:id/skills`

## Skills

- `GET /api/skills`
- `POST /api/skills`
- `GET /api/skills/:id`
- `PATCH /api/skills/:id`
- `DELETE /api/skills/:id`

## Crews

- `GET /api/crews`
- `POST /api/crews`
- `GET /api/crews/:id`
- `PATCH /api/crews/:id`
- `DELETE /api/crews/:id`
- `POST /api/crews/:id/members`
- `DELETE /api/crews/:id/members/:resourceId`

## Work orders

- `GET /api/work-orders`
- `GET /api/work-orders/:id`
- `POST /api/work-orders/:id/incidents`
- `POST /api/work-orders/:id/incidents/:incidentId/tasks/instantiate`
- `PATCH /api/work-orders/:id/tasks/:taskId/status`
- `GET /api/work-orders/:id/notes`
- `POST /api/work-orders/:id/notes`
- `GET /api/work-orders/:id/line-items`
- `POST /api/work-orders/:id/line-items`
- `PATCH /api/work-orders/:id/line-items/:lineItemId`
- `DELETE /api/work-orders/:id/line-items/:lineItemId`

## Work templates

- `GET /api/work-templates`
- `POST /api/work-templates`
- `GET /api/work-templates/:id`
- `PATCH /api/work-templates/:id`
- `DELETE /api/work-templates/:id`

## Service contracts

- `GET /api/service-contracts`
- `POST /api/service-contracts`
- `GET /api/service-contracts/:id`
- `PATCH /api/service-contracts/:id`
- `DELETE /api/service-contracts/:id`
- `POST /api/service-contracts/:id/materialize`

## Invoices

- `POST /api/invoices`
- `GET /api/invoices/:id`
- `POST /api/invoices/:id/work-orders`
- `DELETE /api/invoices/:id/work-orders/:workOrderId`
- `POST /api/invoices/:id/lines`
- `PATCH /api/invoices/:id/lines/:lineId`
- `DELETE /api/invoices/:id/lines/:lineId`
- `PATCH /api/invoices/:id/status`

## Geo tracking

- `POST /api/geo/devices`
- `POST /api/geo/pings`
- `GET /api/geo/resources/:resourceId/latest`
- `GET /api/geo/resources/:resourceId/pings`

## Scheduling

- `POST /api/scheduling/bookings`
- `PATCH /api/scheduling/bookings/:id`
- `POST /api/scheduling/bookings/:id/status`
- `POST /api/scheduling/routes`
- `POST /api/scheduling/routes/:id/stops`
- `PATCH /api/scheduling/routes/:id/stops/reorder`
- `DELETE /api/scheduling/routes/:id/stops/:stopId`
- `GET /api/scheduling/statuses`
- `POST /api/scheduling/statuses`
- `PATCH /api/scheduling/statuses/:id`

## Integrations

- `POST /api/integrations/quickbooks/connect`
- `GET /api/integrations/quickbooks/connection`
- `GET /integrations/quickbooks/callback`
- `POST /webhooks/quickbooks`
