import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../src/infrastructure/db/prisma.js", () => {
  return {
    prisma: {
      customer: {
        findFirst: vi.fn(),
      },
      serviceLocation: {
        count: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        deleteMany: vi.fn(),
      },
    },
  };
});

let prisma: any;
let listServiceLocations: typeof import("../src/modules/service-locations/serviceLocations.service.js").listServiceLocations;
let getServiceLocation: typeof import("../src/modules/service-locations/serviceLocations.service.js").getServiceLocation;
let createServiceLocation: typeof import("../src/modules/service-locations/serviceLocations.service.js").createServiceLocation;
let updateServiceLocation: typeof import("../src/modules/service-locations/serviceLocations.service.js").updateServiceLocation;
let deleteServiceLocation: typeof import("../src/modules/service-locations/serviceLocations.service.js").deleteServiceLocation;

describe("serviceLocations.service", () => {
  beforeAll(async () => {
    ({ prisma } = await import("../src/infrastructure/db/prisma.js"));
    ({
      listServiceLocations,
      getServiceLocation,
      createServiceLocation,
      updateServiceLocation,
      deleteServiceLocation,
    } = await import("../src/modules/service-locations/serviceLocations.service.js"));
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("listServiceLocations applies org, customer, and search filters", async () => {
    prisma.serviceLocation.count.mockResolvedValue(1);
    prisma.serviceLocation.findMany.mockResolvedValue([
      {
        id: "loc-1",
        customerId: "cust-1",
        label: "HQ",
        addressLine1: "100 King St W",
        city: "Toronto",
        province: "ON",
        country: "CA",
        latitude: 43.64,
        longitude: -79.38,
        customer: { id: "cust-1", name: "Acme Corp" },
      },
    ]);

    const result = await listServiceLocations("org-1", {
      q: "king",
      customerId: "cust-1",
      page: 1,
      pageSize: 25,
    });

    expect(prisma.serviceLocation.count).toHaveBeenCalledWith({
      where: {
        orgId: "org-1",
        customerId: "cust-1",
        OR: [
          { label: { contains: "king", mode: "insensitive" } },
          { addressLine1: { contains: "king", mode: "insensitive" } },
          { city: { contains: "king", mode: "insensitive" } },
        ],
      },
    });
    expect(result.total).toBe(1);
    expect(result.items[0]?.id).toBe("loc-1");
  });

  test("getServiceLocation throws when location is missing", async () => {
    prisma.serviceLocation.findFirst.mockResolvedValue(null);

    await expect(getServiceLocation("org-1", "loc-1")).rejects.toMatchObject({
      statusCode: 404,
      code: "SERVICE_LOCATION_NOT_FOUND",
    });
  });

  test("createServiceLocation rejects unknown customer", async () => {
    prisma.customer.findFirst.mockResolvedValue(null);

    await expect(
      createServiceLocation("org-1", {
        customerId: "cust-missing",
        addressLine1: "100 King St W",
        city: "Toronto",
      }),
    ).rejects.toMatchObject({
      statusCode: 404,
      code: "CUSTOMER_NOT_FOUND",
    });

    expect(prisma.serviceLocation.create).not.toHaveBeenCalled();
  });

  test("createServiceLocation creates location when customer exists", async () => {
    prisma.customer.findFirst.mockResolvedValue({ id: "cust-1" });
    prisma.serviceLocation.create.mockResolvedValue({
      id: "loc-1",
      customerId: "cust-1",
      label: "HQ",
      addressLine1: "100 King St W",
      addressLine2: null,
      city: "Toronto",
      province: "ON",
      postalCode: "M5X 1A9",
      country: "CA",
      latitude: 43.64,
      longitude: -79.38,
      createdAt: new Date("2025-01-01"),
      updatedAt: new Date("2025-01-02"),
      customer: { id: "cust-1", name: "Acme Corp" },
    });

    const result = await createServiceLocation("org-1", {
      customerId: "cust-1",
      label: "HQ",
      addressLine1: "100 King St W",
      city: "Toronto",
      province: "ON",
      postalCode: "M5X 1A9",
      country: "CA",
      latitude: 43.64,
      longitude: -79.38,
    });

    expect(prisma.serviceLocation.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        orgId: "org-1",
        customerId: "cust-1",
        label: "HQ",
        city: "Toronto",
      }),
      select: expect.any(Object),
    });
    expect(result.location.id).toBe("loc-1");
  });

  test("updateServiceLocation throws when location is missing", async () => {
    prisma.serviceLocation.findFirst.mockResolvedValue(null);

    await expect(updateServiceLocation("org-1", "loc-1", { city: "Ottawa" })).rejects.toMatchObject(
      {
        statusCode: 404,
        code: "SERVICE_LOCATION_NOT_FOUND",
      },
    );
  });

  test("deleteServiceLocation throws when location is missing", async () => {
    prisma.serviceLocation.deleteMany.mockResolvedValue({ count: 0 });

    await expect(deleteServiceLocation("org-1", "loc-1")).rejects.toMatchObject({
      statusCode: 404,
      code: "SERVICE_LOCATION_NOT_FOUND",
    });
  });
});
