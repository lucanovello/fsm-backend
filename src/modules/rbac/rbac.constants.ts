export const SYSTEM_ROLE_KEYS = ["OWNER", "ADMIN", "EMPLOYEE", "TECH"] as const;

export type SystemRoleKey = (typeof SYSTEM_ROLE_KEYS)[number];

export const PERMISSION_KEYS = {
  customersRead: "customers:read",
  techniciansRead: "technicians:read",
  workOrdersRead: "work-orders:read",
  organizationsManage: "organizations:manage",
} as const;

export const PERMISSION_CATALOG: Array<{ key: string; description: string }> = [
  { key: PERMISSION_KEYS.customersRead, description: "View customer records." },
  { key: PERMISSION_KEYS.techniciansRead, description: "View technician records." },
  { key: PERMISSION_KEYS.workOrdersRead, description: "View work orders." },
  { key: PERMISSION_KEYS.organizationsManage, description: "Manage organization settings." },
];

export const SYSTEM_ROLE_PERMISSIONS: Record<SystemRoleKey, string[]> = {
  OWNER: PERMISSION_CATALOG.map((permission) => permission.key),
  ADMIN: [
    PERMISSION_KEYS.customersRead,
    PERMISSION_KEYS.techniciansRead,
    PERMISSION_KEYS.workOrdersRead,
  ],
  EMPLOYEE: [PERMISSION_KEYS.customersRead, PERMISSION_KEYS.workOrdersRead],
  TECH: [PERMISSION_KEYS.workOrdersRead],
};
