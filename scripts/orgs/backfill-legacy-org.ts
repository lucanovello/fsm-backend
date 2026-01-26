#!/usr/bin/env node

/**
 * Idempotent backfill for multi-tenant foundation.
 * - creates a default legacy organization
 * - creates OrgMember rows for existing users
 * - backfills orgId on existing domain rows
 */

import "dotenv/config";
import { OrgMemberRole } from "@prisma/client";
import process from "node:process";

import { prisma } from "../../src/lib/prisma.js";

const LEGACY_ORG_NAME = process.env.LEGACY_ORG_NAME ?? "Legacy Organization";
const LEGACY_ORG_SLUG = process.env.LEGACY_ORG_SLUG ?? "legacy-default";

const main = async () => {
  try {
    const org = await prisma.organization.upsert({
      where: { slug: LEGACY_ORG_SLUG },
      update: { name: LEGACY_ORG_NAME },
      create: { name: LEGACY_ORG_NAME, slug: LEGACY_ORG_SLUG },
      select: { id: true, name: true, slug: true },
    });

    const users = await prisma.user.findMany({
      select: { id: true, role: true },
      orderBy: { createdAt: "asc" },
    });

    if (users.length > 0) {
      const memberships = users.map((user) => ({
        orgId: org.id,
        userId: user.id,
        role: user.role === "ADMIN" ? OrgMemberRole.OWNER : OrgMemberRole.MEMBER,
      }));

      await prisma.orgMember.createMany({ data: memberships, skipDuplicates: true });
    }

    const [customers, locations, technicians, workOrders, workNotes, lineItems] =
      await prisma.$transaction([
        prisma.customer.updateMany({
          where: { orgId: null },
          data: { orgId: org.id },
        }),
        prisma.serviceLocation.updateMany({
          where: { orgId: null },
          data: { orgId: org.id },
        }),
        prisma.technician.updateMany({
          where: { orgId: null },
          data: { orgId: org.id },
        }),
        prisma.workOrder.updateMany({
          where: { orgId: null },
          data: { orgId: org.id },
        }),
        prisma.workNote.updateMany({
          where: { orgId: null },
          data: { orgId: org.id },
        }),
        prisma.workOrderLineItem.updateMany({
          where: { orgId: null },
          data: { orgId: org.id },
        }),
      ]);

    console.log(
      [
        `[org-backfill] org=${org.slug} (${org.id})`,
        `[org-backfill] members=${users.length}`,
        `[org-backfill] customers=${customers.count}`,
        `[org-backfill] locations=${locations.count}`,
        `[org-backfill] technicians=${technicians.count}`,
        `[org-backfill] workOrders=${workOrders.count}`,
        `[org-backfill] workNotes=${workNotes.count}`,
        `[org-backfill] lineItems=${lineItems.count}`,
      ].join("\n"),
    );
  } catch (err) {
    console.error("[org-backfill] failed", err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
};

await main();
