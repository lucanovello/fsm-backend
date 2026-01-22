import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import type { MockedFunction } from "vitest";
import type { Request, Response } from "express";

vi.mock("../src/modules/technicians/technicians.service.js", () => ({
  listTechnicians: vi.fn(),
}));

let listTechniciansHandler: typeof import("../src/modules/technicians/technicians.controller.js").listTechniciansHandler;
let listTechnicians: MockedFunction<
  typeof import("../src/modules/technicians/technicians.service.js").listTechnicians
>;

describe("technicians.controller", () => {
  beforeAll(async () => {
    ({ listTechniciansHandler } =
      await import("../src/modules/technicians/technicians.controller.js"));

    const techniciansService = await import("../src/modules/technicians/technicians.service.js");
    listTechnicians = vi.mocked(techniciansService.listTechnicians);
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

  test("listTechniciansHandler returns 200 with payload", async () => {
    listTechnicians.mockResolvedValue({ items: [], page: 1, pageSize: 25, total: 0 });

    const req = { query: {} } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await listTechniciansHandler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ items: [], page: 1, pageSize: 25, total: 0 });
    expect(next).not.toHaveBeenCalled();
  });

  test("listTechniciansHandler forwards validation errors", async () => {
    const req = { query: { page: 0 } } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await listTechniciansHandler(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(listTechnicians).not.toHaveBeenCalled();
  });
});
