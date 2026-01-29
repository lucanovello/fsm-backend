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

Sample response: `GET /api/customers`

```jsonc
{
  "items": [
    {
      "id": "cust_1",
      "name": "Acme Corp",
      "email": "ops@acme.example",
      "phone": "+1-555-0100",
    },
  ],
  "page": 1,
  "pageSize": 25,
  "total": 42,
}
```

## Technicians

- `GET /api/technicians`

## Service resources

- `GET /api/service-resources`
- `POST /api/service-resources`
- `GET /api/service-resources/:id`
- `PATCH /api/service-resources/:id`
- `DELETE /api/service-resources/:id`

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

Sample response: `GET /api/work-orders/:id`

```jsonc
{
  "id": "wo_123",
  "summary": "Spring cleanup & inspection",
  "description": "Quarterly HVAC inspection and filter replacement.",
  "status": "SCHEDULED",
  "priority": "HIGH",
  "scheduledStart": "2025-04-12T09:00:00Z",
  "scheduledEnd": "2025-04-12T11:00:00Z",
  "actualStart": null,
  "actualEnd": null,
  "customer": {
    "id": "cust_1",
    "name": "Acme Corp",
  },
  "location": {
    "id": "loc_1",
    "label": "Head Office",
    "addressLine1": "100 King St W",
    "addressLine2": "Suite 1200",
    "city": "Toronto",
    "province": "ON",
    "postalCode": "M5X 1A9",
    "country": "CA",
  },
  "assignedTechnician": {
    "id": "tech_1",
    "displayName": "Alex Tech",
  },
  "notes": [
    {
      "id": "note_1",
      "author": {
        "id": "user_1",
        "email": "alex.tech@example.com",
      },
      "body": "Arrived on-site, starting inspection.",
      "createdAt": "2025-04-12T09:05:00Z",
    },
  ],
  "lineItems": [
    {
      "id": "li_1",
      "description": "HVAC filter replacement",
      "quantity": 2,
      "unitPriceCents": 1299,
    },
  ],
}
```

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

## Integrations

- `POST /api/integrations/quickbooks/connect`
- `GET /api/integrations/quickbooks/connection`
- `GET /integrations/quickbooks/callback`
- `POST /webhooks/quickbooks`
