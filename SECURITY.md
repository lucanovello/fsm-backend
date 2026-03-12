# Security Policy

## Reporting a Vulnerability

If you discover a security issue, do not open a public GitHub issue.

Send a report to the maintainer through the repository contact channel and include:

- A clear description of the issue and impact.
- Reproduction steps or proof of concept.
- Any known mitigations or suggested fix.

We will acknowledge receipt, triage severity, and coordinate a fix and disclosure timeline.

## Supported Versions

This project currently supports security fixes for the latest `main` branch state.

## Secrets Handling

- Never commit `.env` files or credentials.
- Rotate exposed credentials immediately (JWT, SMTP, database, Redis, integration keys).
- Review audit logs after any suspected exposure.
