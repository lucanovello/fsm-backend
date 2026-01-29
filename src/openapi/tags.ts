export const Tags = {
  Operational: "Operational",
  Metrics: "Metrics",
  Auth: "Auth",
  Sessions: "Sessions",
  RBAC: "RBAC",
  Organizations: "Organizations",
  Integrations: "Integrations",
  Customers: "Customers",
  Technicians: "Technicians",
  WorkOrders: "WorkOrders",
  WorkTemplates: "WorkTemplates",
  ServiceContracts: "ServiceContracts",
  Invoices: "Invoices",
  GeoTracking: "GeoTracking",
} as const;

export function applyTagMetadata(openapi: Record<string, unknown>): void {
  openapi.tags = [
    { name: Tags.Operational, description: "Health checks and platform metadata." },
    { name: Tags.Metrics, description: "Observability endpoints secured by config." },
    { name: Tags.Auth, description: "Authentication lifecycle endpoints." },
    { name: Tags.Sessions, description: "Session management for authenticated users." },
    { name: Tags.RBAC, description: "Role-gated resources and authorization flows." },
    { name: Tags.Organizations, description: "Tenant organization management." },
    { name: Tags.Integrations, description: "External system integrations and webhooks." },
    { name: Tags.Customers, description: "Customer directory and profile views." },
    { name: Tags.Technicians, description: "Technician directory and contact details." },
    { name: Tags.WorkOrders, description: "Work order listings and detail views." },
    { name: Tags.WorkTemplates, description: "Work template definitions and task checklists." },
    { name: Tags.ServiceContracts, description: "Recurring service contract definitions." },
    { name: Tags.Invoices, description: "Invoice generation and customer billing." },
    { name: Tags.GeoTracking, description: "Technician geo tracking devices and pings." },
  ];

  openapi["x-tagGroups"] = [
    { name: "Platform", tags: [Tags.Operational, Tags.Metrics] },
    {
      name: "Identity",
      tags: [Tags.Auth, Tags.Sessions, Tags.RBAC, Tags.Organizations, Tags.Integrations],
    },
    {
      name: "FSM",
      tags: [
        Tags.Customers,
        Tags.Technicians,
        Tags.WorkOrders,
        Tags.WorkTemplates,
        Tags.ServiceContracts,
        Tags.Invoices,
        Tags.GeoTracking,
      ],
    },
  ];
}
