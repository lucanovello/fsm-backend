import { beforeAll, beforeEach, describe, expect, test, vi, type MockedFunction } from "vitest";
import type { Request, Response } from "express";

vi.mock("../src/modules/work-templates/workTemplates.service.js", () => ({
  listWorkTemplates: vi.fn(),
  getWorkTemplate: vi.fn(),
  createWorkTemplate: vi.fn(),
  updateWorkTemplate: vi.fn(),
  deleteWorkTemplate: vi.fn(),
}));

let listWorkTemplatesHandler: typeof import("../src/modules/work-templates/workTemplates.controller.js").listWorkTemplatesHandler;
let getWorkTemplateHandler: typeof import("../src/modules/work-templates/workTemplates.controller.js").getWorkTemplateHandler;
let createWorkTemplateHandler: typeof import("../src/modules/work-templates/workTemplates.controller.js").createWorkTemplateHandler;
let updateWorkTemplateHandler: typeof import("../src/modules/work-templates/workTemplates.controller.js").updateWorkTemplateHandler;
let deleteWorkTemplateHandler: typeof import("../src/modules/work-templates/workTemplates.controller.js").deleteWorkTemplateHandler;

type WorkTemplatesService = typeof import("../src/modules/work-templates/workTemplates.service.js");
let listWorkTemplates: MockedFunction<WorkTemplatesService["listWorkTemplates"]>;
let getWorkTemplate: MockedFunction<WorkTemplatesService["getWorkTemplate"]>;
let createWorkTemplate: MockedFunction<WorkTemplatesService["createWorkTemplate"]>;
let updateWorkTemplate: MockedFunction<WorkTemplatesService["updateWorkTemplate"]>;
let deleteWorkTemplate: MockedFunction<WorkTemplatesService["deleteWorkTemplate"]>;

describe("workTemplates.controller", () => {
  beforeAll(async () => {
    ({
      listWorkTemplatesHandler,
      getWorkTemplateHandler,
      createWorkTemplateHandler,
      updateWorkTemplateHandler,
      deleteWorkTemplateHandler,
    } = await import("../src/modules/work-templates/workTemplates.controller.js"));

    const service = await import("../src/modules/work-templates/workTemplates.service.js");
    listWorkTemplates = vi.mocked(service.listWorkTemplates);
    getWorkTemplate = vi.mocked(service.getWorkTemplate);
    createWorkTemplate = vi.mocked(service.createWorkTemplate);
    updateWorkTemplate = vi.mocked(service.updateWorkTemplate);
    deleteWorkTemplate = vi.mocked(service.deleteWorkTemplate);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRes = () =>
    ({
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    }) as unknown as Response;

  test("listWorkTemplatesHandler returns 200", async () => {
    listWorkTemplates.mockResolvedValue({ items: [], page: 1, pageSize: 25, total: 0 });

    const req = { query: {}, org: { id: "org-1", membershipId: "mem-1" } } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await listWorkTemplatesHandler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ items: [], page: 1, pageSize: 25, total: 0 });
    expect(next).not.toHaveBeenCalled();
  });

  test("getWorkTemplateHandler returns 200", async () => {
    getWorkTemplate.mockResolvedValue({ template: { id: "tpl-1" } as any });

    const req = {
      params: { id: "tpl-1" },
      org: { id: "org-1", membershipId: "mem-1" },
    } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await getWorkTemplateHandler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ template: { id: "tpl-1" } });
  });

  test("createWorkTemplateHandler returns 201", async () => {
    createWorkTemplate.mockResolvedValue({ template: { id: "tpl-1" } as any });

    const req = {
      body: { name: "Spring Cleanup" },
      org: { id: "org-1", membershipId: "mem-1" },
    } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await createWorkTemplateHandler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ template: { id: "tpl-1" } });
  });

  test("updateWorkTemplateHandler returns 200", async () => {
    updateWorkTemplate.mockResolvedValue({ template: { id: "tpl-1" } as any });

    const req = {
      params: { id: "tpl-1" },
      body: { name: "Updated" },
      org: { id: "org-1", membershipId: "mem-1" },
    } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await updateWorkTemplateHandler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ template: { id: "tpl-1" } });
  });

  test("deleteWorkTemplateHandler returns 200", async () => {
    deleteWorkTemplate.mockResolvedValue({ deleted: true });

    const req = {
      params: { id: "tpl-1" },
      org: { id: "org-1", membershipId: "mem-1" },
    } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await deleteWorkTemplateHandler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ deleted: true });
  });

  test("listWorkTemplatesHandler rejects missing org", async () => {
    const req = { query: {} } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await listWorkTemplatesHandler(req, res, next);

    const err = next.mock.calls[0]?.[0];
    expect(err).toMatchObject({ statusCode: 400, code: "ORG_REQUIRED" });
  });
});
