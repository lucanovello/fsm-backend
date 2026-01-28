# FSM Backend — Copilot Instructions (Repo-wide)

## Product intent

This repository is the backend for a multi-tenant Field Service Management (FSM) system (initial vertical: lawn/property maintenance) designed to remain industry-agnostic.

## Non-negotiable architecture invariants

1. Multi-tenancy

- A User can belong to multiple Organizations.
- Every business/domain record must be tenant-scoped via `orgId`.
- All reads/writes must enforce org isolation (never rely on client-side filtering).
- Prefer composite unique constraints that include `orgId` where appropriate.

2. Workforce & dispatch model

- Crews are first-class and are the primary assignment target.
- Routes are assigned to a Crew.
- Bookings are assigned to a Crew (not per-tech bookings by default).
- Booking status changes must generate a timeline/audit event (e.g., BookingStatusEvent).
- Work order completion is driven by task/checklist completion (not booking status alone).

3. Templates & execution

- Users can define reusable templates (work types) that generate incidents/tasks/checklists.
- A WorkOrder can contain multiple incidents/work types.

4. Recurrence

- Recurrence is stored as RFC 5545 RRULE + DTSTART (local) + timezone + optional UNTIL.
- Occurrence generation must be idempotent (no duplicates).

5. Billing

- An Invoice belongs to exactly one Customer.
- An Invoice can reference multiple WorkOrders for that same Customer via a join table.

6. Integrations (QuickBooks)

- Store QBO OAuth connection per realmId (company ID).
- Support multiple stored connections in schema, but enforce one active connection per org in application logic (keep it simple; add complexity later).
- Webhooks must ACK quickly and enqueue work; do not do heavy processing in the webhook handler.

## Implementation workflow requirements (for PR work)

- Always begin by scanning the codebase for existing conventions (routing, services, validation, error handling, logging, Prisma patterns, seeding).
- Produce a short plan (steps + risk notes) before editing.
- Keep PRs cohesive, additive, and mergeable; avoid wide breaking changes.
- Prefer incremental migrations:
  - Add columns nullable first
  - Backfill with an idempotent script/command
  - Enforce NOT NULL / constraints in a later PR once cutover is complete
- Add or update tests following existing repo patterns (unit/integration).
- Run lint + tests + Prisma migration checks; fix failures.
- Update docs where needed (migration notes, seed notes, env vars, runbooks).

## Output expectations for PR deliverables

When asked to produce a PR:

- Provide the branch name and a single squash-commit message.
- Generate the PR description using the repository’s PR template. Do not invent template sections; follow the headings and checklist items in the template exactly.
- Include: Summary, Key Changes, Testing steps, Migration/Backfill steps, Risks/Rollback.

## Context handling in VS Code

- Prefer `#codebase` when the relevant files are unknown.
- When a specific document is required (PR template, architecture notes, failing logs), request it via `#` context attachments rather than guessing paths.
