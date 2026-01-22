import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { Prisma } from "@prisma/client";

vi.mock("../src/infrastructure/db/prisma.js", () => {
  return {
    prisma: {
      customer: {
        count: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
      },
      serviceLocation: {
        findMany: vi.fn(),
      },
      workOrder: {
        findMany: vi.fn(),
      },
    },
  };
});

let prisma: any;
let listCustomers: typeof import("../src/modules/customers/customers.service.js").listCustomers;
let getCustomerDetails: typeof import("../src/modules/customers/customers.service.js").getCustomerDetails;

describe("customers.service", () => {
  beforeAll(async () => {
    ({ prisma } = await import("../src/infrastructure/db/prisma.js"));
    ({ listCustomers, getCustomerDetails } =
      await import("../src/modules/customers/customers.service.js"));
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("listCustomers applies search filter when q is present", async () => {
    prisma.customer.count.mockResolvedValue(1);
    prisma.customer.findMany.mockResolvedValue([
      { id: "c1", name: "Acme", email: "acme@example.com", phone: null },
    ]);

    const result = await listCustomers({ q: "acme", page: 2, pageSize: 5 });

    expect(prisma.customer.count).toHaveBeenCalledWith({
      where: {
        OR: [
          { name: { contains: "acme", mode: Prisma.QueryMode.insensitive } },
          { email: { contains: "acme", mode: Prisma.QueryMode.insensitive } },
          { phone: { contains: "acme", mode: Prisma.QueryMode.insensitive } },
        ],
      },
    });

    expect(prisma.customer.findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { name: { contains: "acme", mode: Prisma.QueryMode.insensitive } },
          { email: { contains: "acme", mode: Prisma.QueryMode.insensitive } },
          { phone: { contains: "acme", mode: Prisma.QueryMode.insensitive } },
        ],
      },
      skip: 5,
      take: 5,
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, phone: true },
    });

    expect(result).toEqual({
      items: [{ id: "c1", name: "Acme", email: "acme@example.com", phone: null }],
      page: 2,
      pageSize: 5,
      total: 1,
    });
  });

  test("listCustomers skips filter when q is absent", async () => {
    prisma.customer.count.mockResolvedValue(0);
    prisma.customer.findMany.mockResolvedValue([]);

    const result = await listCustomers({ page: 1, pageSize: 10 });

    expect(prisma.customer.count).toHaveBeenCalledWith({ where: undefined });
    expect(prisma.customer.findMany).toHaveBeenCalledWith({
      where: undefined,
      skip: 0,
      take: 10,
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, phone: true },
    });

    expect(result).toEqual({ items: [], page: 1, pageSize: 10, total: 0 });
  });

  test("getCustomerDetails throws when customer is missing", async () => {
    prisma.customer.findUnique.mockResolvedValue(null);

    await expect(getCustomerDetails("missing")).rejects.toMatchObject({
      code: "CUSTOMER_NOT_FOUND",
      statusCode: 404,
    });
  });

  test("getCustomerDetails returns locations and recent work orders", async () => {
    prisma.customer.findUnique.mockResolvedValue({
      id: "c1",
      name: "Acme",
      email: null,
      phone: "555-0100",
    });

    prisma.serviceLocation.findMany.mockResolvedValue([
      {
        id: "loc-1",
        label: "HQ",
        addressLine1: "1 Main",
        addressLine2: null,
        city: "Toronto",
        province: "ON",
        postalCode: "M1M",
        country: "CA",
        latitude: 43.7,
        longitude: -79.4,
      },
    ]);

    prisma.workOrder.findMany.mockResolvedValue([
      {
        id: "wo-1",
        summary: "Replace filter",
        status: "SCHEDULED",
        priority: "HIGH",
        scheduledStart: new Date("2025-01-10T10:00:00Z"),
        scheduledEnd: null,
        serviceLocation: { id: "loc-1", label: "HQ", city: "Toronto" },
        assignedTechnician: { id: "tech-1", displayName: "Taylor" },
      },
      {
        id: "wo-2",
        summary: "Inspect line",
        status: "COMPLETED",
        priority: "LOW",
        scheduledStart: null,
        scheduledEnd: null,
        serviceLocation: { id: "loc-1", label: "HQ", city: "Toronto" },
        assignedTechnician: null,
      },
    ]);

    const result = await getCustomerDetails("c1");

    expect(result).toEqual({
      customer: {
        id: "c1",
        name: "Acme",
        email: null,
        phone: "555-0100",
      },
      locations: [
        {
          id: "loc-1",
          label: "HQ",
          addressLine1: "1 Main",
          addressLine2: null,
          city: "Toronto",
          province: "ON",
          postalCode: "M1M",
          country: "CA",
          latitude: 43.7,
          longitude: -79.4,
        },
      ],
      recentWorkOrders: [
        {
          id: "wo-1",
          summary: "Replace filter",
          status: "SCHEDULED",
          priority: "HIGH",
          scheduledStart: new Date("2025-01-10T10:00:00Z"),
          scheduledEnd: null,
          location: { id: "loc-1", label: "HQ", city: "Toronto" },
          assignedTechnician: { id: "tech-1", displayName: "Taylor" },
        },
        {
          id: "wo-2",
          summary: "Inspect line",
          status: "COMPLETED",
          priority: "LOW",
          scheduledStart: null,
          scheduledEnd: null,
          location: { id: "loc-1", label: "HQ", city: "Toronto" },
          assignedTechnician: null,
        },
      ],
    });
  });
});
