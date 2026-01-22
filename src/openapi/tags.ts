export const Tags = {
  Operational: "Operational",
  Metrics: "Metrics",
  Auth: "Auth",
  Sessions: "Sessions",
  RBAC: "RBAC",
  Customers: "Customers",
  Technicians: "Technicians",
  WorkOrders: "WorkOrders",
} as const;

export function applyTagMetadata(openapi: Record<string, unknown>): void {
  openapi.tags = [
    { name: Tags.Operational, description: "Health checks and platform metadata." },
    { name: Tags.Metrics, description: "Observability endpoints secured by config." },
    { name: Tags.Auth, description: "Authentication lifecycle endpoints." },
    { name: Tags.Sessions, description: "Session management for authenticated users." },
    { name: Tags.RBAC, description: "Role-gated resources and authorization flows." },
    { name: Tags.Customers, description: "Customer directory and profile views." },
    { name: Tags.Technicians, description: "Technician directory and contact details." },
    { name: Tags.WorkOrders, description: "Work order listings and detail views." },
  ];

  openapi["x-tagGroups"] = [
    { name: "Platform", tags: [Tags.Operational, Tags.Metrics] },
    { name: "Identity", tags: [Tags.Auth, Tags.Sessions, Tags.RBAC] },
    { name: "FSM", tags: [Tags.Customers, Tags.Technicians, Tags.WorkOrders] },
  ];
}
