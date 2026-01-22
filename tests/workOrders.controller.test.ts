import { beforeAll, beforeEach, describe, expect, test, vi, type MockedFunction } from "vitest";
import type { Request, Response } from "express";

vi.mock("../src/modules/work-orders/workOrders.service.js", () => ({
  listWorkOrders: vi.fn(),
  getWorkOrderDetail: vi.fn(),
}));

let listWorkOrdersHandler: typeof import("../src/modules/work-orders/workOrders.controller.js").listWorkOrdersHandler;
let getWorkOrderDetailHandler: typeof import("../src/modules/work-orders/workOrders.controller.js").getWorkOrderDetailHandler;

type WorkOrdersService = typeof import("../src/modules/work-orders/workOrders.service.js");
let listWorkOrders: MockedFunction<WorkOrdersService["listWorkOrders"]>;
let getWorkOrderDetail: MockedFunction<WorkOrdersService["getWorkOrderDetail"]>;

describe("workOrders.controller", () => {
  beforeAll(async () => {
    ({ listWorkOrdersHandler, getWorkOrderDetailHandler } =
      await import("../src/modules/work-orders/workOrders.controller.js"));

    const service = await import("../src/modules/work-orders/workOrders.service.js");
    listWorkOrders = vi.mocked(service.listWorkOrders);
    getWorkOrderDetail = vi.mocked(service.getWorkOrderDetail);
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

  const createReq = (req: Partial<Request>) => req as unknown as Request;

  test("listWorkOrdersHandler returns 200 with payload", async () => {
    listWorkOrders.mockResolvedValue({ items: [], page: 1, pageSize: 25, total: 0 });

    const req = createReq({ query: {} });
    const res = createRes();
    const next = vi.fn();

    await listWorkOrdersHandler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ items: [], page: 1, pageSize: 25, total: 0 });
    expect(next).not.toHaveBeenCalled();
  });

  test("listWorkOrdersHandler forwards validation errors", async () => {
    const req = createReq({ query: { page: "0" } });
    const res = createRes();
    const next = vi.fn();

    await listWorkOrdersHandler(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(listWorkOrders).not.toHaveBeenCalled();
  });

  test("getWorkOrderDetailHandler returns 200 with payload", async () => {
    getWorkOrderDetail.mockResolvedValue({
      id: "wo-1",
      summary: "Replace filter",
      description: null,
      status: "SCHEDULED",
      priority: "HIGH",
      scheduledStart: null,
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
      notes: [],
      lineItems: [],
    });

    const req = createReq({ params: { id: "wo-1" } });
    const res = createRes();
    const next = vi.fn();

    await getWorkOrderDetailHandler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      id: "wo-1",
      summary: "Replace filter",
      description: null,
      status: "SCHEDULED",
      priority: "HIGH",
      scheduledStart: null,
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
      notes: [],
      lineItems: [],
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("getWorkOrderDetailHandler forwards param validation errors", async () => {
    const req = createReq({ params: { id: "" } });
    const res = createRes();
    const next = vi.fn();

    await getWorkOrderDetailHandler(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(getWorkOrderDetail).not.toHaveBeenCalled();
  });
});
