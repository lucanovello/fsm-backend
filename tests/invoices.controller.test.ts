import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";

import type { NextFunction, Request, Response } from "express";

type TestRequest = Request & { org?: { id: string } };

vi.mock("../src/modules/invoices/invoices.service.js", () => {
  return {
    getInvoice: vi.fn(),
    createInvoice: vi.fn(),
    addInvoiceWorkOrders: vi.fn(),
    removeInvoiceWorkOrder: vi.fn(),
    createInvoiceLine: vi.fn(),
    updateInvoiceLine: vi.fn(),
    deleteInvoiceLine: vi.fn(),
    updateInvoiceStatus: vi.fn(),
  };
});

let service: typeof import("../src/modules/invoices/invoices.service.js");
let controllers: typeof import("../src/modules/invoices/invoices.controller.js");

describe("invoices.controller", () => {
  beforeAll(async () => {
    service = await import("../src/modules/invoices/invoices.service.js");
    controllers = await import("../src/modules/invoices/invoices.controller.js");
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRes = () => {
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;
    return res;
  };

  const createReq = (req: Partial<TestRequest>) => req as unknown as Request;

  test("getInvoiceHandler returns 200", async () => {
    vi.mocked(service.getInvoice).mockResolvedValue({ invoice: { id: "inv-1" } } as any);

    const req = createReq({ params: { id: "inv-1" }, org: { id: "org-1" } as any });
    const res = createRes();
    const next = vi.fn() as NextFunction;

    await controllers.getInvoiceHandler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ invoice: { id: "inv-1" } });
    expect(next).not.toHaveBeenCalled();
  });

  test("getInvoiceHandler requires org", async () => {
    const req = createReq({ params: { id: "inv-1" } });
    const res = createRes();
    const next = vi.fn() as NextFunction;

    await controllers.getInvoiceHandler(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(service.getInvoice).not.toHaveBeenCalled();
  });

  test("createInvoiceHandler returns 201", async () => {
    vi.mocked(service.createInvoice).mockResolvedValue({ invoice: { id: "inv-1" } } as any);

    const req = createReq({
      body: { customerId: "cust-1" },
      org: { id: "org-1" } as any,
    });
    const res = createRes();
    const next = vi.fn() as NextFunction;

    await controllers.createInvoiceHandler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ invoice: { id: "inv-1" } });
    expect(next).not.toHaveBeenCalled();
  });

  test("createInvoiceHandler requires org", async () => {
    const req = createReq({ body: { customerId: "cust-1" } });
    const res = createRes();
    const next = vi.fn() as NextFunction;

    await controllers.createInvoiceHandler(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(service.createInvoice).not.toHaveBeenCalled();
  });

  test("addInvoiceWorkOrdersHandler returns 200", async () => {
    vi.mocked(service.addInvoiceWorkOrders).mockResolvedValue({ invoice: { id: "inv-1" } } as any);

    const req = createReq({
      params: { id: "inv-1" },
      body: { workOrderIds: ["wo-1"] },
      org: { id: "org-1" } as any,
    });
    const res = createRes();
    const next = vi.fn() as NextFunction;

    await controllers.addInvoiceWorkOrdersHandler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ invoice: { id: "inv-1" } });
    expect(next).not.toHaveBeenCalled();
  });

  test("addInvoiceWorkOrdersHandler requires org", async () => {
    const req = createReq({ params: { id: "inv-1" }, body: { workOrderIds: ["wo-1"] } });
    const res = createRes();
    const next = vi.fn() as NextFunction;

    await controllers.addInvoiceWorkOrdersHandler(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(service.addInvoiceWorkOrders).not.toHaveBeenCalled();
  });

  test("removeInvoiceWorkOrderHandler returns 200", async () => {
    vi.mocked(service.removeInvoiceWorkOrder).mockResolvedValue({
      invoice: { id: "inv-1" },
    } as any);

    const req = createReq({
      params: { id: "inv-1", workOrderId: "wo-1" },
      org: { id: "org-1" } as any,
    });
    const res = createRes();
    const next = vi.fn() as NextFunction;

    await controllers.removeInvoiceWorkOrderHandler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ invoice: { id: "inv-1" } });
    expect(next).not.toHaveBeenCalled();
  });

  test("createInvoiceLineHandler returns 201", async () => {
    vi.mocked(service.createInvoiceLine).mockResolvedValue({ line: { id: "line-1" } } as any);

    const req = createReq({
      params: { id: "inv-1" },
      body: { description: "Service", quantity: 1, unitPriceCents: 1000 },
      org: { id: "org-1" } as any,
    });
    const res = createRes();
    const next = vi.fn() as NextFunction;

    await controllers.createInvoiceLineHandler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ line: { id: "line-1" } });
    expect(next).not.toHaveBeenCalled();
  });

  test("createInvoiceLineHandler requires org", async () => {
    const req = createReq({
      params: { id: "inv-1" },
      body: { description: "Service", quantity: 1, unitPriceCents: 1000 },
    });
    const res = createRes();
    const next = vi.fn() as NextFunction;

    await controllers.createInvoiceLineHandler(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(service.createInvoiceLine).not.toHaveBeenCalled();
  });

  test("updateInvoiceLineHandler returns 200", async () => {
    vi.mocked(service.updateInvoiceLine).mockResolvedValue({ line: { id: "line-1" } } as any);

    const req = createReq({
      params: { id: "inv-1", lineId: "line-1" },
      body: { description: "Updated" },
      org: { id: "org-1" } as any,
    });
    const res = createRes();
    const next = vi.fn() as NextFunction;

    await controllers.updateInvoiceLineHandler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ line: { id: "line-1" } });
    expect(next).not.toHaveBeenCalled();
  });

  test("deleteInvoiceLineHandler returns 200", async () => {
    vi.mocked(service.deleteInvoiceLine).mockResolvedValue({ deleted: true } as any);

    const req = createReq({
      params: { id: "inv-1", lineId: "line-1" },
      org: { id: "org-1" } as any,
    });
    const res = createRes();
    const next = vi.fn() as NextFunction;

    await controllers.deleteInvoiceLineHandler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ deleted: true });
    expect(next).not.toHaveBeenCalled();
  });

  test("updateInvoiceStatusHandler returns 200", async () => {
    vi.mocked(service.updateInvoiceStatus).mockResolvedValue({ invoice: { id: "inv-1" } } as any);

    const req = createReq({
      params: { id: "inv-1" },
      body: { status: "ISSUED" },
      org: { id: "org-1" } as any,
    });
    const res = createRes();
    const next = vi.fn() as NextFunction;

    await controllers.updateInvoiceStatusHandler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ invoice: { id: "inv-1" } });
    expect(next).not.toHaveBeenCalled();
  });

  test("updateInvoiceStatusHandler requires org", async () => {
    const req = createReq({ params: { id: "inv-1" }, body: { status: "ISSUED" } });
    const res = createRes();
    const next = vi.fn() as NextFunction;

    await controllers.updateInvoiceStatusHandler(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(service.updateInvoiceStatus).not.toHaveBeenCalled();
  });
});
