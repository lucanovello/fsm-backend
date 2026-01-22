import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import type { MockedFunction } from "vitest";
import type { Request, Response } from "express";

vi.mock("../src/modules/customers/customers.service.js", () => ({
  listCustomers: vi.fn(),
  getCustomerDetails: vi.fn(),
}));

type CustomersServiceModule = typeof import("../src/modules/customers/customers.service.js");

let listCustomersHandler: typeof import("../src/modules/customers/customers.controller.js").listCustomersHandler;
let getCustomerDetailsHandler: typeof import("../src/modules/customers/customers.controller.js").getCustomerDetailsHandler;
let listCustomers: MockedFunction<CustomersServiceModule["listCustomers"]>;
let getCustomerDetails: MockedFunction<CustomersServiceModule["getCustomerDetails"]>;

describe("customers.controller", () => {
  beforeAll(async () => {
    ({ listCustomersHandler, getCustomerDetailsHandler } =
      await import("../src/modules/customers/customers.controller.js"));

    const service = await import("../src/modules/customers/customers.service.js");
    listCustomers = vi.mocked(service.listCustomers);
    getCustomerDetails = vi.mocked(service.getCustomerDetails);
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

  test("listCustomersHandler returns 200 with payload", async () => {
    listCustomers.mockResolvedValue({ items: [], page: 1, pageSize: 25, total: 0 });

    const req = { query: {} } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await listCustomersHandler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ items: [], page: 1, pageSize: 25, total: 0 });
    expect(next).not.toHaveBeenCalled();
  });

  test("listCustomersHandler forwards validation errors", async () => {
    const req = { query: { page: 0 } } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await listCustomersHandler(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(listCustomers).not.toHaveBeenCalled();
  });

  test("getCustomerDetailsHandler returns 200 with payload", async () => {
    getCustomerDetails.mockResolvedValue({
      customer: { id: "c1", name: "Acme", email: null, phone: null },
      locations: [],
      recentWorkOrders: [],
    });

    const req = { params: { id: "c1" } } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await getCustomerDetailsHandler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      customer: { id: "c1", name: "Acme", email: null, phone: null },
      locations: [],
      recentWorkOrders: [],
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("getCustomerDetailsHandler forwards param validation errors", async () => {
    const req = { params: { id: "" } } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await getCustomerDetailsHandler(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(getCustomerDetails).not.toHaveBeenCalled();
  });
});
