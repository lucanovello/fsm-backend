import { prisma } from "../../infrastructure/db/prisma.js";

import { PERMISSION_CATALOG, SYSTEM_ROLE_KEYS, SYSTEM_ROLE_PERMISSIONS } from "./rbac.constants.js";

import type { SystemRoleKey } from "./rbac.constants.js";
import type { Prisma, PrismaClient } from "@prisma/client";

type DbClient = PrismaClient | Prisma.TransactionClient;

type PermissionRecord = { id: string; key: string };

export async function ensurePermissionCatalog(db: DbClient = prisma): Promise<PermissionRecord[]> {
  await Promise.all(
    PERMISSION_CATALOG.map((permission) =>
      db.permission.upsert({
        where: { key: permission.key },
        update: { description: permission.description },
        create: { key: permission.key, description: permission.description },
      }),
    ),
  );

  return db.permission.findMany({
    where: { key: { in: PERMISSION_CATALOG.map((permission) => permission.key) } },
    select: { id: true, key: true },
  });
}

export async function ensureSystemRoles(db: DbClient, orgId: string) {
  const permissions = await ensurePermissionCatalog(db);
  const permissionIdByKey = new Map(
    permissions.map((permission) => [permission.key, permission.id]),
  );

  for (const key of SYSTEM_ROLE_KEYS) {
    const role = await db.orgRole.upsert({
      where: { orgId_key: { orgId, key } },
      update: { name: key, isSystem: true },
      create: { orgId, name: key, key, isSystem: true },
      select: { id: true },
    });

    const rolePermissionIds = (SYSTEM_ROLE_PERMISSIONS[key] ?? [])
      .map((permissionKey) => permissionIdByKey.get(permissionKey))
      .filter((permissionId): permissionId is string => Boolean(permissionId));

    if (rolePermissionIds.length === 0) {
      continue;
    }

    await db.rolePermission.createMany({
      data: rolePermissionIds.map((permissionId) => ({ roleId: role.id, permissionId })),
      skipDuplicates: true,
    });
  }
}

export async function assignSystemRoleToMember(
  db: DbClient,
  memberId: string,
  orgId: string,
  roleKey: SystemRoleKey,
) {
  const role = await db.orgRole.findUnique({
    where: { orgId_key: { orgId, key: roleKey } },
    select: { id: true },
  });

  if (!role) {
    throw new Error(`System role ${roleKey} missing for org ${orgId}`);
  }

  await db.memberRole.upsert({
    where: { memberId_roleId: { memberId, roleId: role.id } },
    update: {},
    create: { memberId, roleId: role.id },
  });
}

export async function hasPermission(
  db: DbClient,
  args: { orgId: string; memberId: string; key: string },
): Promise<boolean> {
  const match = await db.rolePermission.findFirst({
    where: {
      permission: { key: args.key },
      role: {
        orgId: args.orgId,
        memberRoles: { some: { memberId: args.memberId } },
      },
    },
    select: { id: true },
  });

  return Boolean(match);
}

export async function hasSystemRole(
  db: DbClient,
  args: { orgId: string; memberId: string; roleKey: SystemRoleKey },
): Promise<boolean> {
  const match = await db.memberRole.findFirst({
    where: {
      memberId: args.memberId,
      role: {
        orgId: args.orgId,
        key: args.roleKey,
      },
    },
    select: { id: true },
  });

  return Boolean(match);
}
