import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import type { MockedFunction } from "vitest";
import type { Request, Response } from "express";

vi.mock("../src/modules/service-resources/serviceResources.service.js", () => ({
  listServiceResources: vi.fn(),
  getServiceResource: vi.fn(),
  createServiceResource: vi.fn(),
  updateServiceResource: vi.fn(),
  deleteServiceResource: vi.fn(),
}));

let listServiceResourcesHandler: typeof import("../src/modules/service-resources/serviceResources.controller.js").listServiceResourcesHandler;
let getServiceResourceHandler: typeof import("../src/modules/service-resources/serviceResources.controller.js").getServiceResourceHandler;
let createServiceResourceHandler: typeof import("../src/modules/service-resources/serviceResources.controller.js").createServiceResourceHandler;
let updateServiceResourceHandler: typeof import("../src/modules/service-resources/serviceResources.controller.js").updateServiceResourceHandler;
let deleteServiceResourceHandler: typeof import("../src/modules/service-resources/serviceResources.controller.js").deleteServiceResourceHandler;
let listServiceResources: MockedFunction<
  typeof import("../src/modules/service-resources/serviceResources.service.js").listServiceResources
>;
let getServiceResource: MockedFunction<
  typeof import("../src/modules/service-resources/serviceResources.service.js").getServiceResource
>;
let createServiceResource: MockedFunction<
  typeof import("../src/modules/service-resources/serviceResources.service.js").createServiceResource
>;
let updateServiceResource: MockedFunction<
  typeof import("../src/modules/service-resources/serviceResources.service.js").updateServiceResource
>;
let deleteServiceResource: MockedFunction<
  typeof import("../src/modules/service-resources/serviceResources.service.js").deleteServiceResource
>;

describe("serviceResources.controller", () => {
  beforeAll(async () => {
    ({
      listServiceResourcesHandler,
      getServiceResourceHandler,
      createServiceResourceHandler,
      updateServiceResourceHandler,
      deleteServiceResourceHandler,
    } = await import("../src/modules/service-resources/serviceResources.controller.js"));

    const service = await import("../src/modules/service-resources/serviceResources.service.js");
    listServiceResources = vi.mocked(service.listServiceResources);
    getServiceResource = vi.mocked(service.getServiceResource);
    createServiceResource = vi.mocked(service.createServiceResource);
    updateServiceResource = vi.mocked(service.updateServiceResource);
    deleteServiceResource = vi.mocked(service.deleteServiceResource);
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

  test("listServiceResourcesHandler returns 200 with payload", async () => {
    listServiceResources.mockResolvedValue({ items: [], page: 1, pageSize: 25, total: 0 });

    const req = { query: {}, org: { id: "org-1" } } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await listServiceResourcesHandler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ items: [], page: 1, pageSize: 25, total: 0 });
    expect(next).not.toHaveBeenCalled();
  });

  test("listServiceResourcesHandler requires org", async () => {
    const req = { query: {} } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await listServiceResourcesHandler(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(listServiceResources).not.toHaveBeenCalled();
  });

  test("getServiceResourceHandler returns 200 with payload", async () => {
    getServiceResource.mockResolvedValue({ resource: { id: "res-1" } as any });

    const req = { params: { id: "res-1" }, org: { id: "org-1" } } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await getServiceResourceHandler(req, res, next);

    expect(getServiceResource).toHaveBeenCalledWith("org-1", "res-1");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ resource: { id: "res-1" } });
  });

  test("createServiceResourceHandler returns 201 with payload", async () => {
    createServiceResource.mockResolvedValue({ resource: { id: "res-1" } as any });

    const req = {
      body: { displayName: "Alex" },
      org: { id: "org-1" },
    } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await createServiceResourceHandler(req, res, next);

    expect(createServiceResource).toHaveBeenCalledWith("org-1", { displayName: "Alex" });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ resource: { id: "res-1" } });
  });

  test("updateServiceResourceHandler returns 200 with payload", async () => {
    updateServiceResource.mockResolvedValue({ resource: { id: "res-1" } as any });

    const req = {
      params: { id: "res-1" },
      body: { displayName: "Alex" },
      org: { id: "org-1" },
    } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await updateServiceResourceHandler(req, res, next);

    expect(updateServiceResource).toHaveBeenCalledWith("org-1", "res-1", { displayName: "Alex" });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("deleteServiceResourceHandler returns 200 with payload", async () => {
    deleteServiceResource.mockResolvedValue({ deleted: true });

    const req = { params: { id: "res-1" }, org: { id: "org-1" } } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await deleteServiceResourceHandler(req, res, next);

    expect(deleteServiceResource).toHaveBeenCalledWith("org-1", "res-1");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ deleted: true });
  });
});
