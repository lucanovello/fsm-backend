#!/usr/bin/env node

/**
 * Idempotent scheduling backfill.
 * - creates bookings for legacy work orders with scheduling info
 * - ensures a baseline crew requirement per booking
 * - builds routes/stops for scheduled bookings
 */

import "dotenv/config";
import process from "node:process";

import { prisma } from "../../src/lib/prisma.js";

const DEFAULT_REQUIREMENT_TYPE = process.env.DEFAULT_REQUIREMENT_TYPE ?? "CREW";

const dayKey = (date: Date) =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(
    date.getUTCDate(),
  ).padStart(2, "0")}`;

const startOfUtcDay = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

const main = async () => {
  try {
    const orgs = await prisma.organization.findMany({ select: { id: true, slug: true } });

    for (const org of orgs) {
      const defaultStatus = await prisma.bookingStatus.findFirst({
        where: { orgId: org.id, isActive: true },
        orderBy: [{ isDefault: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
        select: { id: true },
      });

      if (!defaultStatus) {
        console.log(`[scheduling-backfill] org=${org.slug} (${org.id}) no booking status found`);
        continue;
      }

      const crews = await prisma.crew.findMany({ where: { orgId: org.id }, select: { id: true } });

      if (crews.length === 0) {
        console.log(`[scheduling-backfill] org=${org.slug} (${org.id}) no crews found`);
        continue;
      }

      const defaultCrewId = crews[0].id;

      const workOrders = await prisma.workOrder.findMany({
        where: {
          orgId: org.id,
          OR: [
            { scheduledStart: { not: null } },
            { scheduledEnd: { not: null } },
            { assignedTechnicianId: { not: null } },
          ],
        },
        select: {
          id: true,
          scheduledStart: true,
          scheduledEnd: true,
          assignedTechnicianId: true,
        },
      });

      let bookingsUpserted = 0;
      let requirementsUpserted = 0;
      let routesUpserted = 0;
      let stopsUpserted = 0;

      const routeBuckets = new Map<
        string,
        { crewId: string; routeDate: Date; bookings: string[] }
      >();

      for (const workOrder of workOrders) {
        let crewId = defaultCrewId;

        if (workOrder.assignedTechnicianId) {
          const resource = await prisma.serviceResource.findFirst({
            where: { orgId: org.id, legacyTechnicianId: workOrder.assignedTechnicianId },
            select: { id: true },
          });

          if (resource) {
            const crewMember = await prisma.crewMember.findFirst({
              where: { orgId: org.id, resourceId: resource.id },
              select: { crewId: true },
            });

            if (crewMember) {
              crewId = crewMember.crewId;
            }
          }
        }

        const booking = await prisma.booking.upsert({
          where: {
            orgId_workOrderId: {
              orgId: org.id,
              workOrderId: workOrder.id,
            },
          },
          update: {
            crewId,
            statusId: defaultStatus.id,
            scheduledStart: workOrder.scheduledStart,
            scheduledEnd: workOrder.scheduledEnd,
          },
          create: {
            orgId: org.id,
            workOrderId: workOrder.id,
            crewId,
            statusId: defaultStatus.id,
            scheduledStart: workOrder.scheduledStart,
            scheduledEnd: workOrder.scheduledEnd,
          },
          select: { id: true, scheduledStart: true },
        });

        bookingsUpserted += 1;

        await prisma.resourceRequirement.upsert({
          where: {
            orgId_bookingId_resourceType: {
              orgId: org.id,
              bookingId: booking.id,
              resourceType: DEFAULT_REQUIREMENT_TYPE,
            },
          },
          update: { quantity: 1 },
          create: {
            orgId: org.id,
            bookingId: booking.id,
            resourceType: DEFAULT_REQUIREMENT_TYPE,
            quantity: 1,
          },
        });

        requirementsUpserted += 1;

        if (booking.scheduledStart) {
          const key = `${crewId}:${dayKey(booking.scheduledStart)}`;
          const routeDate = startOfUtcDay(booking.scheduledStart);

          const bucket = routeBuckets.get(key) ?? {
            crewId,
            routeDate,
            bookings: [],
          };

          bucket.bookings.push(booking.id);
          routeBuckets.set(key, bucket);
        }
      }

      for (const bucket of routeBuckets.values()) {
        const route = await prisma.route.upsert({
          where: {
            orgId_crewId_routeDate: {
              orgId: org.id,
              crewId: bucket.crewId,
              routeDate: bucket.routeDate,
            },
          },
          update: {},
          create: {
            orgId: org.id,
            crewId: bucket.crewId,
            routeDate: bucket.routeDate,
          },
          select: { id: true },
        });

        routesUpserted += 1;

        const bookings = await prisma.booking.findMany({
          where: { id: { in: bucket.bookings } },
          select: { id: true, scheduledStart: true },
        });

        bookings.sort((a, b) => {
          const aTime = a.scheduledStart?.getTime() ?? 0;
          const bTime = b.scheduledStart?.getTime() ?? 0;
          return aTime - bTime;
        });

        let position = 1;
        for (const booking of bookings) {
          await prisma.routeStop.upsert({
            where: {
              orgId_bookingId: {
                orgId: org.id,
                bookingId: booking.id,
              },
            },
            update: {
              routeId: route.id,
              position,
            },
            create: {
              orgId: org.id,
              routeId: route.id,
              bookingId: booking.id,
              position,
            },
          });

          position += 1;
          stopsUpserted += 1;
        }
      }

      console.log(
        [
          `[scheduling-backfill] org=${org.slug} (${org.id})`,
          `[scheduling-backfill] bookingsUpserted=${bookingsUpserted}`,
          `[scheduling-backfill] requirementsUpserted=${requirementsUpserted}`,
          `[scheduling-backfill] routesUpserted=${routesUpserted}`,
          `[scheduling-backfill] stopsUpserted=${stopsUpserted}`,
        ].join("\n"),
      );
    }
  } catch (err) {
    console.error("[scheduling-backfill] failed", err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
};

await main();
