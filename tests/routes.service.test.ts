import { Prisma } from "@prisma/client";
import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../src/infrastructure/db/prisma.js", () => {
  return {
    prisma: {
      route: {
        findFirst: vi.fn(),
        create: vi.fn(),
      },
      routeStop: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        deleteMany: vi.fn(),
        create: vi.fn(),
      },
      booking: {
        findFirst: vi.fn(),
      },
      crew: {
        findFirst: vi.fn(),
      },
      $transaction: vi.fn(),
    },
  };
});

let prisma: any;
let createRoute: typeof import("../src/modules/scheduling/routes.service.js").createRoute;
let addRouteStop: typeof import("../src/modules/scheduling/routes.service.js").addRouteStop;
let removeRouteStop: typeof import("../src/modules/scheduling/routes.service.js").removeRouteStop;
let reorderRouteStops: typeof import("../src/modules/scheduling/routes.service.js").reorderRouteStops;

describe("routes.service", () => {
  const prismaUniqueError = (target: string | string[]) =>
    new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
      code: "P2002",
      clientVersion: "test",
      meta: { target },
    });

  beforeAll(async () => {
    ({ prisma } = await import("../src/infrastructure/db/prisma.js"));
    ({ createRoute, addRouteStop, removeRouteStop, reorderRouteStops } =
      await import("../src/modules/scheduling/routes.service.js"));
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("reorderRouteStops updates positions in order", async () => {
    prisma.route.findFirst.mockResolvedValue({ id: "route-1", crewId: "crew-1" });

    prisma.routeStop.findMany
      .mockResolvedValueOnce([{ id: "stop-1" }, { id: "stop-2" }])
      .mockResolvedValueOnce([
        {
          id: "stop-2",
          routeId: "route-1",
          bookingId: "booking-2",
          position: 1,
          createdAt: new Date("2025-01-01"),
          updatedAt: new Date("2025-01-02"),
        },
        {
          id: "stop-1",
          routeId: "route-1",
          bookingId: "booking-1",
          position: 2,
          createdAt: new Date("2025-01-01"),
          updatedAt: new Date("2025-01-02"),
        },
      ]);

    prisma.routeStop.update.mockResolvedValue({});
    prisma.$transaction.mockResolvedValue([]);

    const result = await reorderRouteStops("org-1", "route-1", {
      stopIds: ["stop-2", "stop-1"],
    });

    expect(prisma.routeStop.update).toHaveBeenCalledWith({
      where: { id: "stop-2" },
      data: { position: 1 },
    });

    expect(prisma.routeStop.update).toHaveBeenCalledWith({
      where: { id: "stop-1" },
      data: { position: 2 },
    });

    expect(result.stops[0].id).toBe("stop-2");
    expect(result.stops[1].id).toBe("stop-1");
  });

  test("createRoute creates a route", async () => {
    prisma.crew.findFirst.mockResolvedValue({ id: "crew-1" });
    prisma.route.create.mockResolvedValue({
      id: "route-1",
      crewId: "crew-1",
      routeDate: new Date("2025-02-01T00:00:00Z"),
      createdAt: new Date("2025-01-01"),
      updatedAt: new Date("2025-01-01"),
    });

    const result = await createRoute("org-1", {
      crewId: "crew-1",
      routeDate: "2025-02-01T00:00:00Z",
    });

    expect(prisma.route.create).toHaveBeenCalledWith({
      data: { orgId: "org-1", crewId: "crew-1", routeDate: new Date("2025-02-01T00:00:00Z") },
      select: expect.any(Object),
    });

    expect(result.route.id).toBe("route-1");
  });

  test("createRoute maps unique conflict", async () => {
    prisma.crew.findFirst.mockResolvedValue({ id: "crew-1" });
    prisma.route.create.mockRejectedValue(prismaUniqueError(["orgId", "crewId", "routeDate"]));

    await expect(
      createRoute("org-1", { crewId: "crew-1", routeDate: "2025-02-01T00:00:00Z" }),
    ).rejects.toMatchObject({ statusCode: 409, code: "ROUTE_ALREADY_EXISTS" });
  });

  test("addRouteStop rejects crew mismatch", async () => {
    prisma.route.findFirst.mockResolvedValue({ id: "route-1", crewId: "crew-1" });
    prisma.booking.findFirst.mockResolvedValue({ id: "booking-1", crewId: "crew-2" });

    await expect(
      addRouteStop("org-1", "route-1", { bookingId: "booking-1" }),
    ).rejects.toMatchObject({ statusCode: 409, code: "BOOKING_CREW_MISMATCH" });
  });

  test("addRouteStop maps already routed booking", async () => {
    prisma.route.findFirst.mockResolvedValue({ id: "route-1", crewId: "crew-1" });
    prisma.booking.findFirst.mockResolvedValue({ id: "booking-1", crewId: "crew-1" });
    prisma.routeStop.findFirst.mockResolvedValue({ position: 1 });
    prisma.routeStop.create.mockRejectedValue(prismaUniqueError("bookingId"));

    await expect(
      addRouteStop("org-1", "route-1", { bookingId: "booking-1" }),
    ).rejects.toMatchObject({ statusCode: 409, code: "BOOKING_ALREADY_ROUTED" });
  });

  test("removeRouteStop resequences remaining stops", async () => {
    prisma.routeStop.deleteMany.mockResolvedValue({ count: 1 });
    prisma.routeStop.findMany.mockResolvedValue([{ id: "stop-2" }]);
    prisma.$transaction.mockResolvedValue([]);

    const result = await removeRouteStop("org-1", "route-1", "stop-1");

    expect(prisma.routeStop.update).toHaveBeenCalledWith({
      where: { id: "stop-2" },
      data: { position: 1 },
    });
    expect(result).toEqual({ deleted: true });
  });

  test("removeRouteStop throws when stop missing", async () => {
    prisma.routeStop.deleteMany.mockResolvedValue({ count: 0 });

    await expect(removeRouteStop("org-1", "route-1", "stop-1")).rejects.toMatchObject({
      statusCode: 404,
      code: "ROUTE_STOP_NOT_FOUND",
    });
  });
});
