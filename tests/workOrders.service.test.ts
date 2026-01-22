import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { WorkOrderPriority, WorkOrderStatus } from "@prisma/client";

vi.mock("../src/infrastructure/db/prisma.js", () => {
  return {
    prisma: {
      workOrder: {
        count: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
      },
    },
  };
});

let prisma: any;
let listWorkOrders: typeof import("../src/modules/work-orders/workOrders.service.js").listWorkOrders;
let getWorkOrderDetail: typeof import("../src/modules/work-orders/workOrders.service.js").getWorkOrderDetail;

describe("workOrders.service", () => {
  beforeAll(async () => {
    ({ prisma } = await import("../src/infrastructure/db/prisma.js"));
    ({ listWorkOrders, getWorkOrderDetail } =
      await import("../src/modules/work-orders/workOrders.service.js"));
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("listWorkOrders applies filters and shapes results", async () => {
    prisma.workOrder.count.mockResolvedValue(2);
    prisma.workOrder.findMany.mockResolvedValue([
      {
        id: "wo-1",
        summary: "Replace filter",
        status: WorkOrderStatus.SCHEDULED,
        priority: WorkOrderPriority.HIGH,
        scheduledStart: new Date("2025-01-15T09:00:00Z"),
        scheduledEnd: null,
        customer: { id: "c1", name: "Acme" },
        serviceLocation: { id: "loc-1", label: "HQ", city: "Toronto" },
        assignedTechnician: { id: "tech-1", displayName: "Taylor" },
      },
      {
        id: "wo-2",
        summary: "Inspect line",
        status: WorkOrderStatus.COMPLETED,
        priority: WorkOrderPriority.LOW,
        scheduledStart: null,
        scheduledEnd: null,
        customer: { id: "c2", name: "Beta" },
        serviceLocation: { id: "loc-2", label: null, city: "Boston" },
        assignedTechnician: null,
      },
    ]);

    const result = await listWorkOrders({
      status: "SCHEDULED,COMPLETED,SCHEDULED",
      technicianId: "tech-1",
      date: "2025-01-15",
      page: 2,
      pageSize: 10,
    });

    const where = prisma.workOrder.count.mock.calls[0][0].where;
    expect(where.status?.in).toEqual([WorkOrderStatus.SCHEDULED, WorkOrderStatus.COMPLETED]);
    expect(where.assignedTechnicianId).toBe("tech-1");
    expect(where.scheduledStart?.gte).toBeInstanceOf(Date);
    expect(where.scheduledStart?.lt).toBeInstanceOf(Date);

    const expectedStart = new Date(Date.UTC(2025, 0, 15));
    expect(where.scheduledStart?.gte.toISOString()).toBe(expectedStart.toISOString());

    expect(prisma.workOrder.findMany).toHaveBeenCalledWith({
      where,
      skip: 10,
      take: 10,
      orderBy: { scheduledStart: "asc" },
      select: {
        id: true,
        summary: true,
        status: true,
        priority: true,
        scheduledStart: true,
        scheduledEnd: true,
        customer: { select: { id: true, name: true } },
        serviceLocation: { select: { id: true, label: true, city: true } },
        assignedTechnician: { select: { id: true, displayName: true } },
      },
    });

    expect(result).toEqual({
      items: [
        {
          id: "wo-1",
          summary: "Replace filter",
          status: WorkOrderStatus.SCHEDULED,
          priority: WorkOrderPriority.HIGH,
          scheduledStart: new Date("2025-01-15T09:00:00Z"),
          scheduledEnd: null,
          customer: { id: "c1", name: "Acme" },
          location: { id: "loc-1", label: "HQ", city: "Toronto" },
          assignedTechnician: { id: "tech-1", displayName: "Taylor" },
        },
        {
          id: "wo-2",
          summary: "Inspect line",
          status: WorkOrderStatus.COMPLETED,
          priority: WorkOrderPriority.LOW,
          scheduledStart: null,
          scheduledEnd: null,
          customer: { id: "c2", name: "Beta" },
          location: { id: "loc-2", label: null, city: "Boston" },
          assignedTechnician: null,
        },
      ],
      page: 2,
      pageSize: 10,
      total: 2,
    });
  });

  test("listWorkOrders rejects invalid status", async () => {
    await expect(listWorkOrders({ status: "BOGUS", page: 1, pageSize: 25 })).rejects.toMatchObject({
      code: "INVALID_STATUS",
      statusCode: 400,
    });
  });

  test("listWorkOrders rejects invalid date", async () => {
    await expect(
      listWorkOrders({ date: "not-a-date", page: 1, pageSize: 25 }),
    ).rejects.toMatchObject({
      code: "INVALID_DATE",
      statusCode: 400,
    });
  });

  test("getWorkOrderDetail throws when missing", async () => {
    prisma.workOrder.findUnique.mockResolvedValue(null);

    await expect(getWorkOrderDetail("missing")).rejects.toMatchObject({
      code: "WORK_ORDER_NOT_FOUND",
      statusCode: 404,
    });
  });

  test("getWorkOrderDetail returns mapped detail", async () => {
    prisma.workOrder.findUnique.mockResolvedValue({
      id: "wo-1",
      summary: "Replace filter",
      description: null,
      status: WorkOrderStatus.SCHEDULED,
      priority: WorkOrderPriority.NORMAL,
      scheduledStart: new Date("2025-01-15T09:00:00Z"),
      scheduledEnd: null,
      actualStart: null,
      actualEnd: null,
      customer: { id: "c1", name: "Acme" },
      serviceLocation: {
        id: "loc-1",
        label: "HQ",
        addressLine1: "1 Main",
        addressLine2: null,
        city: "Toronto",
        province: "ON",
        postalCode: "M1M",
        country: "CA",
      },
      assignedTechnician: null,
      notes: [
        {
          id: "note-1",
          body: "Arrived",
          createdAt: new Date("2025-01-15T09:10:00Z"),
          author: { id: "u1", email: "tech@example.com" },
        },
      ],
      lineItems: [
        {
          id: "li-1",
          description: "Filter",
          quantity: 1,
          unitPriceCents: 2500,
        },
      ],
    });

    const result = await getWorkOrderDetail("wo-1");

    expect(result).toEqual({
      id: "wo-1",
      summary: "Replace filter",
      description: null,
      status: WorkOrderStatus.SCHEDULED,
      priority: WorkOrderPriority.NORMAL,
      scheduledStart: new Date("2025-01-15T09:00:00Z"),
      scheduledEnd: null,
      actualStart: null,
      actualEnd: null,
      customer: { id: "c1", name: "Acme" },
      location: {
        id: "loc-1",
        label: "HQ",
        addressLine1: "1 Main",
        addressLine2: null,
        city: "Toronto",
        province: "ON",
        postalCode: "M1M",
        country: "CA",
      },
      assignedTechnician: null,
      notes: [
        {
          id: "note-1",
          author: { id: "u1", email: "tech@example.com" },
          body: "Arrived",
          createdAt: new Date("2025-01-15T09:10:00Z"),
        },
      ],
      lineItems: [
        {
          id: "li-1",
          description: "Filter",
          quantity: 1,
          unitPriceCents: 2500,
        },
      ],
    });
  });
});
