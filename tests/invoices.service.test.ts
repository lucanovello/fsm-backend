import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../src/infrastructure/db/prisma.js", () => {
  return {
    prisma: {
      invoice: {
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      invoiceWorkOrder: {
        createMany: vi.fn(),
        deleteMany: vi.fn(),
      },
      invoiceLine: {
        create: vi.fn(),
        update: vi.fn(),
        deleteMany: vi.fn(),
        findFirst: vi.fn(),
      },
      customer: {
        findFirst: vi.fn(),
      },
      workOrder: {
        findMany: vi.fn(),
      },
    },
  };
});

let prisma: any;
let createInvoice: typeof import("../src/modules/invoices/invoices.service.js").createInvoice;
let addInvoiceWorkOrders: typeof import("../src/modules/invoices/invoices.service.js").addInvoiceWorkOrders;
let removeInvoiceWorkOrder: typeof import("../src/modules/invoices/invoices.service.js").removeInvoiceWorkOrder;
let updateInvoiceStatus: typeof import("../src/modules/invoices/invoices.service.js").updateInvoiceStatus;
let createInvoiceLine: typeof import("../src/modules/invoices/invoices.service.js").createInvoiceLine;
let updateInvoiceLine: typeof import("../src/modules/invoices/invoices.service.js").updateInvoiceLine;

describe("invoices.service", () => {
  beforeAll(async () => {
    ({ prisma } = await import("../src/infrastructure/db/prisma.js"));
    ({
      createInvoice,
      addInvoiceWorkOrders,
      removeInvoiceWorkOrder,
      updateInvoiceStatus,
      createInvoiceLine,
      updateInvoiceLine,
    } = await import("../src/modules/invoices/invoices.service.js"));
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("createInvoice rejects missing customer", async () => {
    prisma.customer.findFirst.mockResolvedValue(null);

    await expect(createInvoice("org-1", { customerId: "cust-1" })).rejects.toMatchObject({
      statusCode: 404,
      code: "CUSTOMER_NOT_FOUND",
    });
  });

  test("createInvoice rejects work order customer mismatch", async () => {
    prisma.customer.findFirst.mockResolvedValue({ id: "cust-1" });
    prisma.workOrder.findMany.mockResolvedValue([{ id: "wo-1", customerId: "cust-2" }]);

    await expect(
      createInvoice("org-1", { customerId: "cust-1", workOrderIds: ["wo-1"] }),
    ).rejects.toMatchObject({ statusCode: 400, code: "INVOICE_WORK_ORDER_CUSTOMER_MISMATCH" });
  });

  test("createInvoice rejects missing work order", async () => {
    prisma.customer.findFirst.mockResolvedValue({ id: "cust-1" });
    prisma.workOrder.findMany.mockResolvedValue([]);

    await expect(
      createInvoice("org-1", { customerId: "cust-1", workOrderIds: ["wo-1"] }),
    ).rejects.toMatchObject({ statusCode: 404, code: "WORK_ORDER_NOT_FOUND" });
  });

  test("createInvoice creates invoice with lines", async () => {
    prisma.customer.findFirst.mockResolvedValue({ id: "cust-1" });
    prisma.workOrder.findMany.mockResolvedValue([{ id: "wo-1", customerId: "cust-1" }]);
    prisma.invoice.create.mockResolvedValue({
      id: "inv-1",
      status: "DRAFT",
      dueDate: null,
      memo: null,
      issuedAt: null,
      paidAt: null,
      voidedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      customer: { id: "cust-1", name: "Acme" },
      workOrders: [],
      lines: [{ id: "line-1", description: "Service", quantity: 1, unitPriceCents: 1200 }],
    });

    const result = await createInvoice("org-1", {
      customerId: "cust-1",
      workOrderIds: ["wo-1"],
      lines: [{ description: "Service", quantity: 1, unitPriceCents: 1200 }],
    });

    expect(result.invoice.id).toBe("inv-1");
  });

  test("createInvoice creates invoice without work orders", async () => {
    prisma.customer.findFirst.mockResolvedValue({ id: "cust-1" });
    prisma.invoice.create.mockResolvedValue({
      id: "inv-2",
      status: "DRAFT",
      dueDate: null,
      memo: null,
      issuedAt: null,
      paidAt: null,
      voidedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      customer: { id: "cust-1", name: "Acme" },
      workOrders: [],
      lines: [],
    });

    const result = await createInvoice("org-1", { customerId: "cust-1" });

    expect(result.invoice.id).toBe("inv-2");
  });

  test("addInvoiceWorkOrders rejects non-draft invoice", async () => {
    prisma.invoice.findFirst.mockResolvedValue({
      id: "inv-1",
      status: "ISSUED",
      customerId: "cust-1",
    });

    await expect(
      addInvoiceWorkOrders("org-1", "inv-1", { workOrderIds: ["wo-1"] }),
    ).rejects.toMatchObject({ statusCode: 409, code: "INVOICE_NOT_DRAFT" });
  });

  test("addInvoiceWorkOrders adds work orders", async () => {
    prisma.invoice.findFirst
      .mockResolvedValueOnce({ id: "inv-1", status: "DRAFT", customerId: "cust-1" })
      .mockResolvedValueOnce({
        id: "inv-1",
        status: "DRAFT",
        dueDate: null,
        memo: null,
        issuedAt: null,
        paidAt: null,
        voidedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        customer: { id: "cust-1", name: "Acme" },
        workOrders: [],
        lines: [],
      });
    prisma.workOrder.findMany.mockResolvedValue([{ id: "wo-1", customerId: "cust-1" }]);
    prisma.invoiceWorkOrder.createMany.mockResolvedValue({ count: 1 });

    const result = await addInvoiceWorkOrders("org-1", "inv-1", { workOrderIds: ["wo-1"] });

    expect(result.invoice.id).toBe("inv-1");
  });

  test("removeInvoiceWorkOrder rejects missing link", async () => {
    prisma.invoice.findFirst.mockResolvedValue({
      id: "inv-1",
      status: "DRAFT",
      customerId: "cust-1",
    });
    prisma.invoiceWorkOrder.deleteMany.mockResolvedValue({ count: 0 });

    await expect(removeInvoiceWorkOrder("org-1", "inv-1", "wo-1")).rejects.toMatchObject({
      statusCode: 404,
      code: "INVOICE_WORK_ORDER_NOT_FOUND",
    });
  });

  test("removeInvoiceWorkOrder removes link", async () => {
    prisma.invoice.findFirst
      .mockResolvedValueOnce({ id: "inv-1", status: "DRAFT", customerId: "cust-1" })
      .mockResolvedValueOnce({
        id: "inv-1",
        status: "DRAFT",
        dueDate: null,
        memo: null,
        issuedAt: null,
        paidAt: null,
        voidedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        customer: { id: "cust-1", name: "Acme" },
        workOrders: [],
        lines: [],
      });
    prisma.invoiceWorkOrder.deleteMany.mockResolvedValue({ count: 1 });

    const result = await removeInvoiceWorkOrder("org-1", "inv-1", "wo-1");

    expect(result.invoice.id).toBe("inv-1");
  });

  test("createInvoiceLine creates line", async () => {
    prisma.invoice.findFirst.mockResolvedValue({
      id: "inv-1",
      status: "DRAFT",
      customerId: "cust-1",
    });
    prisma.invoiceLine.create.mockResolvedValue({
      id: "line-1",
      description: "Service",
      quantity: 1,
      unitPriceCents: 1200,
    });

    const result = await createInvoiceLine("org-1", "inv-1", {
      description: "Service",
      quantity: 1,
      unitPriceCents: 1200,
    });

    expect(result.line.id).toBe("line-1");
  });

  test("updateInvoiceLine updates line", async () => {
    prisma.invoice.findFirst.mockResolvedValue({
      id: "inv-1",
      status: "DRAFT",
      customerId: "cust-1",
    });
    prisma.invoiceLine.findFirst.mockResolvedValue({ id: "line-1" });
    prisma.invoiceLine.update.mockResolvedValue({
      id: "line-1",
      description: "Updated",
      quantity: 2,
      unitPriceCents: 1500,
    });

    const result = await updateInvoiceLine("org-1", "inv-1", "line-1", {
      description: "Updated",
      quantity: 2,
    });

    expect(result.line.description).toBe("Updated");
  });

  test("updateInvoiceLine rejects missing line", async () => {
    prisma.invoice.findFirst.mockResolvedValue({
      id: "inv-1",
      status: "DRAFT",
      customerId: "cust-1",
    });
    prisma.invoiceLine.findFirst.mockResolvedValue(null);

    await expect(
      updateInvoiceLine("org-1", "inv-1", "line-1", { description: "Updated" }),
    ).rejects.toMatchObject({ statusCode: 404, code: "INVOICE_LINE_NOT_FOUND" });
  });

  test("updateInvoiceStatus rejects invalid transition", async () => {
    prisma.invoice.findFirst.mockResolvedValue({
      id: "inv-1",
      status: "PAID",
      customerId: "cust-1",
    });

    await expect(updateInvoiceStatus("org-1", "inv-1", { status: "ISSUED" })).rejects.toMatchObject(
      { statusCode: 409, code: "INVOICE_STATUS_INVALID_TRANSITION" },
    );
  });

  test("updateInvoiceStatus sets issued timestamp", async () => {
    prisma.invoice.findFirst.mockResolvedValue({
      id: "inv-1",
      status: "DRAFT",
      customerId: "cust-1",
    });
    prisma.invoice.update.mockResolvedValue({
      id: "inv-1",
      status: "ISSUED",
      dueDate: null,
      memo: null,
      issuedAt: new Date(),
      paidAt: null,
      voidedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      customer: { id: "cust-1", name: "Acme" },
      workOrders: [],
      lines: [],
    });

    await updateInvoiceStatus("org-1", "inv-1", { status: "ISSUED" });

    expect(prisma.invoice.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "ISSUED", issuedAt: expect.any(Date) }),
      }),
    );
  });

  test("updateInvoiceStatus sets voided timestamp", async () => {
    prisma.invoice.findFirst.mockResolvedValue({
      id: "inv-1",
      status: "ISSUED",
      customerId: "cust-1",
    });
    prisma.invoice.update.mockResolvedValue({
      id: "inv-1",
      status: "VOID",
      dueDate: null,
      memo: null,
      issuedAt: new Date(),
      paidAt: null,
      voidedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      customer: { id: "cust-1", name: "Acme" },
      workOrders: [],
      lines: [],
    });

    await updateInvoiceStatus("org-1", "inv-1", { status: "VOID" });

    expect(prisma.invoice.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "VOID", voidedAt: expect.any(Date) }),
      }),
    );
  });
});
