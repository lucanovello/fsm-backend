import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import type { MockedFunction } from "vitest";
import type { Request, Response } from "express";

vi.mock("../src/modules/crews/crews.service.js", () => ({
  listCrews: vi.fn(),
  getCrewDetail: vi.fn(),
  createCrew: vi.fn(),
  updateCrew: vi.fn(),
  deleteCrew: vi.fn(),
  addCrewMember: vi.fn(),
  removeCrewMember: vi.fn(),
}));

let listCrewsHandler: typeof import("../src/modules/crews/crews.controller.js").listCrewsHandler;
let getCrewDetailHandler: typeof import("../src/modules/crews/crews.controller.js").getCrewDetailHandler;
let createCrewHandler: typeof import("../src/modules/crews/crews.controller.js").createCrewHandler;
let updateCrewHandler: typeof import("../src/modules/crews/crews.controller.js").updateCrewHandler;
let deleteCrewHandler: typeof import("../src/modules/crews/crews.controller.js").deleteCrewHandler;
let addCrewMemberHandler: typeof import("../src/modules/crews/crews.controller.js").addCrewMemberHandler;
let removeCrewMemberHandler: typeof import("../src/modules/crews/crews.controller.js").removeCrewMemberHandler;
let listCrews: MockedFunction<typeof import("../src/modules/crews/crews.service.js").listCrews>;
let getCrewDetail: MockedFunction<
  typeof import("../src/modules/crews/crews.service.js").getCrewDetail
>;
let createCrew: MockedFunction<typeof import("../src/modules/crews/crews.service.js").createCrew>;
let updateCrew: MockedFunction<typeof import("../src/modules/crews/crews.service.js").updateCrew>;
let deleteCrew: MockedFunction<typeof import("../src/modules/crews/crews.service.js").deleteCrew>;
let addCrewMember: MockedFunction<
  typeof import("../src/modules/crews/crews.service.js").addCrewMember
>;
let removeCrewMember: MockedFunction<
  typeof import("../src/modules/crews/crews.service.js").removeCrewMember
>;

describe("crews.controller", () => {
  beforeAll(async () => {
    ({
      listCrewsHandler,
      getCrewDetailHandler,
      createCrewHandler,
      updateCrewHandler,
      deleteCrewHandler,
      addCrewMemberHandler,
      removeCrewMemberHandler,
    } = await import("../src/modules/crews/crews.controller.js"));
    const service = await import("../src/modules/crews/crews.service.js");
    listCrews = vi.mocked(service.listCrews);
    getCrewDetail = vi.mocked(service.getCrewDetail);
    createCrew = vi.mocked(service.createCrew);
    updateCrew = vi.mocked(service.updateCrew);
    deleteCrew = vi.mocked(service.deleteCrew);
    addCrewMember = vi.mocked(service.addCrewMember);
    removeCrewMember = vi.mocked(service.removeCrewMember);
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

  test("listCrewsHandler returns 200 with payload", async () => {
    listCrews.mockResolvedValue({ items: [], page: 1, pageSize: 25, total: 0 });

    const req = { query: {}, org: { id: "org-1" } } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await listCrewsHandler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ items: [], page: 1, pageSize: 25, total: 0 });
    expect(next).not.toHaveBeenCalled();
  });

  test("listCrewsHandler requires org", async () => {
    const req = { query: {} } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await listCrewsHandler(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(listCrews).not.toHaveBeenCalled();
  });

  test("getCrewDetailHandler returns 200 with payload", async () => {
    getCrewDetail.mockResolvedValue({ crew: { id: "crew-1" } as any });

    const req = { params: { id: "crew-1" }, org: { id: "org-1" } } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await getCrewDetailHandler(req, res, next);

    expect(getCrewDetail).toHaveBeenCalledWith("org-1", "crew-1");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ crew: { id: "crew-1" } });
  });

  test("createCrewHandler returns 201 with payload", async () => {
    createCrew.mockResolvedValue({ crew: { id: "crew-1" } as any });

    const req = {
      body: { name: "Alpha" },
      org: { id: "org-1" },
    } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await createCrewHandler(req, res, next);

    expect(createCrew).toHaveBeenCalledWith("org-1", { name: "Alpha" });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ crew: { id: "crew-1" } });
  });

  test("updateCrewHandler returns 200 with payload", async () => {
    updateCrew.mockResolvedValue({ crew: { id: "crew-1" } as any });

    const req = {
      params: { id: "crew-1" },
      body: { description: "Updated" },
      org: { id: "org-1" },
    } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await updateCrewHandler(req, res, next);

    expect(updateCrew).toHaveBeenCalledWith("org-1", "crew-1", { description: "Updated" });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("deleteCrewHandler returns 200 with payload", async () => {
    deleteCrew.mockResolvedValue({ deleted: true });

    const req = { params: { id: "crew-1" }, org: { id: "org-1" } } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await deleteCrewHandler(req, res, next);

    expect(deleteCrew).toHaveBeenCalledWith("org-1", "crew-1");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ deleted: true });
  });

  test("addCrewMemberHandler returns 201 with payload", async () => {
    addCrewMember.mockResolvedValue({ member: { id: "member-1" } as any });

    const req = {
      params: { id: "crew-1" },
      body: { resourceId: "res-1" },
      org: { id: "org-1" },
    } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await addCrewMemberHandler(req, res, next);

    expect(addCrewMember).toHaveBeenCalledWith("org-1", "crew-1", { resourceId: "res-1" });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ member: { id: "member-1" } });
  });

  test("removeCrewMemberHandler returns 200 with payload", async () => {
    removeCrewMember.mockResolvedValue({ deleted: true });

    const req = {
      params: { id: "crew-1", resourceId: "res-1" },
      org: { id: "org-1" },
    } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await removeCrewMemberHandler(req, res, next);

    expect(removeCrewMember).toHaveBeenCalledWith("org-1", "crew-1", "res-1");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ deleted: true });
  });
});
