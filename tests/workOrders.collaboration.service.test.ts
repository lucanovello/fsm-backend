import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../src/infrastructure/db/prisma.js", () => {
  return {
    prisma: {
      workOrder: {
        findFirst: vi.fn(),
      },
      workNote: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
      workOrderLineItem: {
        findMany: vi.fn(),
        create: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
        deleteMany: vi.fn(),
      },
    },
  };
});

let prisma: any;
let listWorkOrderNotes: typeof import("../src/modules/work-orders/workOrders.service.js").listWorkOrderNotes;
let addWorkOrderNote: typeof import("../src/modules/work-orders/workOrders.service.js").addWorkOrderNote;
let listWorkOrderLineItems: typeof import("../src/modules/work-orders/workOrders.service.js").listWorkOrderLineItems;
let addWorkOrderLineItem: typeof import("../src/modules/work-orders/workOrders.service.js").addWorkOrderLineItem;
let updateWorkOrderLineItem: typeof import("../src/modules/work-orders/workOrders.service.js").updateWorkOrderLineItem;
let deleteWorkOrderLineItem: typeof import("../src/modules/work-orders/workOrders.service.js").deleteWorkOrderLineItem;

describe("workOrders collaboration and billing service", () => {
  beforeAll(async () => {
    ({ prisma } = await import("../src/infrastructure/db/prisma.js"));
    ({
      listWorkOrderNotes,
      addWorkOrderNote,
      listWorkOrderLineItems,
      addWorkOrderLineItem,
      updateWorkOrderLineItem,
      deleteWorkOrderLineItem,
    } = await import("../src/modules/work-orders/workOrders.service.js"));
  });

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.workOrder.findFirst.mockResolvedValue({ id: "wo-1" });
  });

  test("listWorkOrderNotes returns note records", async () => {
    prisma.workNote.findMany.mockResolvedValue([
      {
        id: "note-1",
        body: "Started diagnostics",
        createdAt: new Date("2025-01-01"),
        updatedAt: new Date("2025-01-01"),
        author: { id: "user-1", email: "tech@example.com" },
      },
    ]);

    const result = await listWorkOrderNotes("org-1", "wo-1");

    expect(prisma.workNote.findMany).toHaveBeenCalledWith({
      where: { orgId: "org-1", workOrderId: "wo-1" },
      orderBy: { createdAt: "asc" },
      select: expect.any(Object),
    });
    expect(result.notes).toHaveLength(1);
  });

  test("addWorkOrderNote creates a note", async () => {
    prisma.workNote.create.mockResolvedValue({
      id: "note-1",
      body: "Started diagnostics",
      createdAt: new Date("2025-01-01"),
      updatedAt: new Date("2025-01-01"),
      author: { id: "user-1", email: "tech@example.com" },
    });

    const result = await addWorkOrderNote("org-1", "wo-1", "user-1", { body: "Started diagnostics" });

    expect(prisma.workNote.create).toHaveBeenCalledWith({
      data: {
        orgId: "org-1",
        workOrderId: "wo-1",
        authorUserId: "user-1",
        body: "Started diagnostics",
      },
      select: expect.any(Object),
    });
    expect(result.note.id).toBe("note-1");
  });

  test("addWorkOrderLineItem creates a line item", async () => {
    prisma.workOrderLineItem.create.mockResolvedValue({
      id: "li-1",
      description: "Filter replacement",
      quantity: 2,
      unitPriceCents: 1299,
      createdAt: new Date("2025-01-01"),
      updatedAt: new Date("2025-01-01"),
    });

    const result = await addWorkOrderLineItem("org-1", "wo-1", {
      description: "Filter replacement",
      quantity: 2,
      unitPriceCents: 1299,
    });

    expect(prisma.workOrderLineItem.create).toHaveBeenCalledWith({
      data: {
        orgId: "org-1",
        workOrderId: "wo-1",
        description: "Filter replacement",
        quantity: 2,
        unitPriceCents: 1299,
      },
      select: expect.any(Object),
    });
    expect(result.lineItem.id).toBe("li-1");
  });

  test("updateWorkOrderLineItem throws when line item is missing", async () => {
    prisma.workOrderLineItem.findFirst.mockResolvedValue(null);

    await expect(
      updateWorkOrderLineItem("org-1", "wo-1", "li-missing", { quantity: 3 }),
    ).rejects.toMatchObject({
      statusCode: 404,
      code: "WORK_ORDER_LINE_ITEM_NOT_FOUND",
    });
  });

  test("deleteWorkOrderLineItem throws when line item is missing", async () => {
    prisma.workOrderLineItem.deleteMany.mockResolvedValue({ count: 0 });

    await expect(deleteWorkOrderLineItem("org-1", "wo-1", "li-missing")).rejects.toMatchObject({
      statusCode: 404,
      code: "WORK_ORDER_LINE_ITEM_NOT_FOUND",
    });
  });

  test("listWorkOrderLineItems returns line item records", async () => {
    prisma.workOrderLineItem.findMany.mockResolvedValue([
      {
        id: "li-1",
        description: "Filter replacement",
        quantity: 2,
        unitPriceCents: 1299,
        createdAt: new Date("2025-01-01"),
        updatedAt: new Date("2025-01-01"),
      },
    ]);

    const result = await listWorkOrderLineItems("org-1", "wo-1");
    expect(result.lineItems).toHaveLength(1);
  });
});
