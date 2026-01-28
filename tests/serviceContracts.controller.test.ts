import { beforeAll, beforeEach, describe, expect, test, vi, type MockedFunction } from "vitest";
import type { Request, Response } from "express";

vi.mock("../src/modules/service-contracts/serviceContracts.service.js", () => ({
  listServiceContracts: vi.fn(),
  getServiceContract: vi.fn(),
  createServiceContract: vi.fn(),
  updateServiceContract: vi.fn(),
  deleteServiceContract: vi.fn(),
  materializeServiceContractOccurrences: vi.fn(),
}));

let listServiceContractsHandler: typeof import("../src/modules/service-contracts/serviceContracts.controller.js").listServiceContractsHandler;
let getServiceContractHandler: typeof import("../src/modules/service-contracts/serviceContracts.controller.js").getServiceContractHandler;
let createServiceContractHandler: typeof import("../src/modules/service-contracts/serviceContracts.controller.js").createServiceContractHandler;
let updateServiceContractHandler: typeof import("../src/modules/service-contracts/serviceContracts.controller.js").updateServiceContractHandler;
let deleteServiceContractHandler: typeof import("../src/modules/service-contracts/serviceContracts.controller.js").deleteServiceContractHandler;
let materializeServiceContractHandler: typeof import("../src/modules/service-contracts/serviceContracts.controller.js").materializeServiceContractHandler;

let listServiceContracts: MockedFunction<
  typeof import("../src/modules/service-contracts/serviceContracts.service.js").listServiceContracts
>;
let getServiceContract: MockedFunction<
  typeof import("../src/modules/service-contracts/serviceContracts.service.js").getServiceContract
>;
let createServiceContract: MockedFunction<
  typeof import("../src/modules/service-contracts/serviceContracts.service.js").createServiceContract
>;
let updateServiceContract: MockedFunction<
  typeof import("../src/modules/service-contracts/serviceContracts.service.js").updateServiceContract
>;
let deleteServiceContract: MockedFunction<
  typeof import("../src/modules/service-contracts/serviceContracts.service.js").deleteServiceContract
>;
let materializeServiceContractOccurrences: MockedFunction<
  typeof import("../src/modules/service-contracts/serviceContracts.service.js").materializeServiceContractOccurrences
>;

describe("serviceContracts.controller", () => {
  beforeAll(async () => {
    ({
      listServiceContractsHandler,
      getServiceContractHandler,
      createServiceContractHandler,
      updateServiceContractHandler,
      deleteServiceContractHandler,
      materializeServiceContractHandler,
    } = await import("../src/modules/service-contracts/serviceContracts.controller.js"));

    const service = await import("../src/modules/service-contracts/serviceContracts.service.js");
    listServiceContracts = vi.mocked(service.listServiceContracts);
    getServiceContract = vi.mocked(service.getServiceContract);
    createServiceContract = vi.mocked(service.createServiceContract);
    updateServiceContract = vi.mocked(service.updateServiceContract);
    deleteServiceContract = vi.mocked(service.deleteServiceContract);
    materializeServiceContractOccurrences = vi.mocked(
      service.materializeServiceContractOccurrences,
    );
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRes = () =>
    ({
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    }) as unknown as Response;

  test("listServiceContractsHandler returns 200", async () => {
    listServiceContracts.mockResolvedValue({ items: [], page: 1, pageSize: 25, total: 0 });

    const req = { query: {}, org: { id: "org-1", membershipId: "mem-1" } } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await listServiceContractsHandler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ items: [], page: 1, pageSize: 25, total: 0 });
  });

  test("getServiceContractHandler returns 200", async () => {
    getServiceContract.mockResolvedValue({ contract: { id: "contract-1" } as any });

    const req = {
      params: { id: "contract-1" },
      org: { id: "org-1", membershipId: "mem-1" },
    } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await getServiceContractHandler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ contract: { id: "contract-1" } });
  });

  test("createServiceContractHandler returns 201", async () => {
    createServiceContract.mockResolvedValue({ contract: { id: "contract-1" } as any });

    const req = {
      body: {
        customerId: "cust-1",
        name: "Weekly Lawn",
        recurrence: { rrule: "FREQ=DAILY", dtstartLocal: "2025-01-01T09:00:00", timeZone: "UTC" },
      },
      org: { id: "org-1", membershipId: "mem-1" },
    } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await createServiceContractHandler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ contract: { id: "contract-1" } });
  });

  test("updateServiceContractHandler returns 200", async () => {
    updateServiceContract.mockResolvedValue({ contract: { id: "contract-1" } as any });

    const req = {
      params: { id: "contract-1" },
      body: { name: "Updated" },
      org: { id: "org-1", membershipId: "mem-1" },
    } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await updateServiceContractHandler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ contract: { id: "contract-1" } });
  });

  test("deleteServiceContractHandler returns 200", async () => {
    deleteServiceContract.mockResolvedValue({ deleted: true });

    const req = {
      params: { id: "contract-1" },
      org: { id: "org-1", membershipId: "mem-1" },
    } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await deleteServiceContractHandler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ deleted: true });
  });

  test("materializeServiceContractHandler returns 200", async () => {
    materializeServiceContractOccurrences.mockResolvedValue({ occurrences: [] });

    const req = {
      params: { id: "contract-1" },
      body: { count: 2 },
      org: { id: "org-1", membershipId: "mem-1" },
    } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await materializeServiceContractHandler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ occurrences: [] });
  });

  test("listServiceContractsHandler rejects missing org", async () => {
    const req = { query: {} } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await listServiceContractsHandler(req, res, next);

    const err = next.mock.calls[0]?.[0];
    expect(err).toMatchObject({ statusCode: 400, code: "ORG_REQUIRED" });
  });

  test("createServiceContractHandler rejects missing org", async () => {
    const req = {
      body: {
        customerId: "cust-1",
        name: "Weekly Lawn",
        recurrence: { rrule: "FREQ=DAILY", dtstartLocal: "2025-01-01T09:00:00", timeZone: "UTC" },
      },
    } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await createServiceContractHandler(req, res, next);

    const err = next.mock.calls[0]?.[0];
    expect(err).toMatchObject({ statusCode: 400, code: "ORG_REQUIRED" });
  });

  test("materializeServiceContractHandler rejects missing org", async () => {
    const req = {
      params: { id: "contract-1" },
      body: { count: 2 },
    } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await materializeServiceContractHandler(req, res, next);

    const err = next.mock.calls[0]?.[0];
    expect(err).toMatchObject({ statusCode: 400, code: "ORG_REQUIRED" });
  });
});
