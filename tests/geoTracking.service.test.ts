import { Prisma } from "@prisma/client";
import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../src/infrastructure/db/prisma.js", () => {
  return {
    prisma: {
      geoDevice: {
        create: vi.fn(),
        findMany: vi.fn(),
      },
      geoPing: {
        createMany: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      serviceResource: {
        findFirst: vi.fn(),
      },
    },
  };
});

let prisma: any;
let createGeoDevice: typeof import("../src/modules/geo-tracking/geoTracking.service.js").createGeoDevice;
let ingestGeoPings: typeof import("../src/modules/geo-tracking/geoTracking.service.js").ingestGeoPings;
let getLatestGeoPing: typeof import("../src/modules/geo-tracking/geoTracking.service.js").getLatestGeoPing;
let listGeoPingsForResource: typeof import("../src/modules/geo-tracking/geoTracking.service.js").listGeoPingsForResource;

const prismaUniqueError = (target: string | string[]) =>
  new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
    code: "P2002",
    clientVersion: "test",
    meta: { target },
  });

describe("geoTracking.service", () => {
  beforeAll(async () => {
    ({ prisma } = await import("../src/infrastructure/db/prisma.js"));
    ({ createGeoDevice, ingestGeoPings, getLatestGeoPing, listGeoPingsForResource } =
      await import("../src/modules/geo-tracking/geoTracking.service.js"));
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("createGeoDevice rejects unknown service resource", async () => {
    prisma.serviceResource.findFirst.mockResolvedValue(null);

    await expect(
      createGeoDevice("org-1", { serviceResourceId: "res-1", deviceIdentifier: "dev-1" }),
    ).rejects.toMatchObject({ statusCode: 404, code: "SERVICE_RESOURCE_NOT_FOUND" });

    expect(prisma.geoDevice.create).not.toHaveBeenCalled();
  });

  test("createGeoDevice maps unique constraint", async () => {
    prisma.serviceResource.findFirst.mockResolvedValue({ id: "res-1" });
    prisma.geoDevice.create.mockRejectedValue(prismaUniqueError("deviceIdentifier"));

    await expect(
      createGeoDevice("org-1", { serviceResourceId: "res-1", deviceIdentifier: "dev-1" }),
    ).rejects.toMatchObject({ statusCode: 409, code: "GEO_DEVICE_IDENTIFIER_TAKEN" });
  });

  test("ingestGeoPings rejects missing device", async () => {
    prisma.geoDevice.findMany.mockResolvedValue([]);

    await expect(
      ingestGeoPings("org-1", {
        pings: [
          {
            deviceId: "dev-1",
            recordedAt: "2025-01-01T10:00:00Z",
            latitude: 10,
            longitude: 20,
          },
        ],
      }),
    ).rejects.toMatchObject({ statusCode: 404, code: "GEO_DEVICE_NOT_FOUND" });

    expect(prisma.geoDevice.findMany).toHaveBeenCalledWith({
      where: { id: { in: ["dev-1"] }, orgId: "org-1", isActive: true },
      select: { id: true, serviceResourceId: true },
    });
  });

  test("ingestGeoPings writes mapped data", async () => {
    prisma.geoDevice.findMany.mockResolvedValue([{ id: "dev-1", serviceResourceId: "res-1" }]);
    prisma.geoPing.createMany.mockResolvedValue({ count: 1 });

    const result = await ingestGeoPings("org-1", {
      pings: [
        {
          deviceId: "dev-1",
          recordedAt: "2025-01-01T10:00:00Z",
          latitude: 10,
          longitude: 20,
          accuracyMeters: 5,
        },
      ],
    });

    expect(prisma.geoPing.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          orgId: "org-1",
          deviceId: "dev-1",
          serviceResourceId: "res-1",
          latitude: 10,
          longitude: 20,
          accuracyMeters: 5,
        }),
      ],
    });
    expect(result).toEqual({ inserted: 1 });
  });

  test("getLatestGeoPing returns null when missing", async () => {
    prisma.serviceResource.findFirst.mockResolvedValue({ id: "res-1" });
    prisma.geoPing.findFirst.mockResolvedValue(null);

    const result = await getLatestGeoPing("org-1", "res-1");

    expect(prisma.geoPing.findFirst).toHaveBeenCalledWith({
      where: { orgId: "org-1", serviceResourceId: "res-1" },
      orderBy: { recordedAt: "desc" },
      select: expect.any(Object),
    });
    expect(result).toEqual({ ping: null });
  });

  test("listGeoPingsForResource scopes org and date range", async () => {
    prisma.serviceResource.findFirst.mockResolvedValue({ id: "res-1" });
    prisma.geoPing.findMany.mockResolvedValue([]);

    const result = await listGeoPingsForResource("org-1", "res-1", {
      from: "2025-01-01T00:00:00Z",
      to: "2025-01-02T00:00:00Z",
      limit: 50,
    });

    expect(prisma.geoPing.findMany).toHaveBeenCalledWith({
      where: {
        orgId: "org-1",
        serviceResourceId: "res-1",
        recordedAt: {
          gte: new Date("2025-01-01T00:00:00Z"),
          lte: new Date("2025-01-02T00:00:00Z"),
        },
      },
      orderBy: { recordedAt: "desc" },
      take: 50,
      select: expect.any(Object),
    });
    expect(result).toEqual({ items: [], count: 0 });
  });

  test("listGeoPingsForResource omits date filter when none provided", async () => {
    prisma.serviceResource.findFirst.mockResolvedValue({ id: "res-1" });
    prisma.geoPing.findMany.mockResolvedValue([]);

    await listGeoPingsForResource("org-1", "res-1", { limit: 25 });

    expect(prisma.geoPing.findMany).toHaveBeenCalledWith({
      where: { orgId: "org-1", serviceResourceId: "res-1" },
      orderBy: { recordedAt: "desc" },
      take: 25,
      select: expect.any(Object),
    });
  });
});
