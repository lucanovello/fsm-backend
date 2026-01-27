#!/usr/bin/env node

/**
 * Idempotent workforce backfill.
 * - maps legacy technicians to ServiceResources
 * - creates a default crew per org when resources exist and no crews are present
 */

import "dotenv/config";
import process from "node:process";

import { prisma } from "../../src/lib/prisma.js";

const DEFAULT_CREW_NAME = process.env.DEFAULT_CREW_NAME ?? "Default Crew";

const main = async () => {
  try {
    const orgs = await prisma.organization.findMany({ select: { id: true, slug: true } });

    for (const org of orgs) {
      const technicians = await prisma.technician.findMany({
        where: { orgId: org.id },
        select: {
          id: true,
          displayName: true,
          phone: true,
          user: { select: { id: true, email: true } },
        },
      });

      let resourcesUpserted = 0;

      for (const technician of technicians) {
        const membership = await prisma.orgMember.findFirst({
          where: { orgId: org.id, userId: technician.user.id },
          select: { id: true },
        });

        await prisma.serviceResource.upsert({
          where: {
            orgId_legacyTechnicianId: {
              orgId: org.id,
              legacyTechnicianId: technician.id,
            },
          },
          update: {
            displayName: technician.displayName,
            phone: technician.phone ?? null,
            email: technician.user.email ?? null,
            orgMemberId: membership?.id ?? null,
            isActive: true,
          },
          create: {
            orgId: org.id,
            legacyTechnicianId: technician.id,
            displayName: technician.displayName,
            phone: technician.phone ?? null,
            email: technician.user.email ?? null,
            orgMemberId: membership?.id ?? null,
            isActive: true,
          },
        });

        resourcesUpserted += 1;
      }

      const crewCount = await prisma.crew.count({ where: { orgId: org.id } });
      const resourceCount = await prisma.serviceResource.count({ where: { orgId: org.id } });

      let defaultCrewCreated = false;
      let crewMembersAdded = 0;

      if (crewCount === 0 && resourceCount > 0) {
        const crew = await prisma.crew.create({
          data: { orgId: org.id, name: DEFAULT_CREW_NAME },
          select: { id: true },
        });

        const resources = await prisma.serviceResource.findMany({
          where: { orgId: org.id },
          select: { id: true },
        });

        if (resources.length > 0) {
          const result = await prisma.crewMember.createMany({
            data: resources.map((resource) => ({
              orgId: org.id,
              crewId: crew.id,
              resourceId: resource.id,
            })),
            skipDuplicates: true,
          });

          crewMembersAdded = result.count;
        }

        defaultCrewCreated = true;
      }

      console.log(
        [
          `[workforce-backfill] org=${org.slug} (${org.id})`,
          `[workforce-backfill] technicians=${technicians.length}`,
          `[workforce-backfill] resourcesUpserted=${resourcesUpserted}`,
          `[workforce-backfill] defaultCrewCreated=${defaultCrewCreated}`,
          `[workforce-backfill] crewMembersAdded=${crewMembersAdded}`,
        ].join("\n"),
      );
    }
  } catch (err) {
    console.error("[workforce-backfill] failed", err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
};

await main();
