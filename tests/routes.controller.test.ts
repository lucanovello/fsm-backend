import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import type { MockedFunction } from "vitest";
import type { Request, Response } from "express";

vi.mock("../src/modules/scheduling/routes.service.js", () => ({
  createRoute: vi.fn(),
  addRouteStop: vi.fn(),
  reorderRouteStops: vi.fn(),
  removeRouteStop: vi.fn(),
}));

let createRouteHandler: typeof import("../src/modules/scheduling/routes.controller.js").createRouteHandler;
let addRouteStopHandler: typeof import("../src/modules/scheduling/routes.controller.js").addRouteStopHandler;
let reorderRouteStopsHandler: typeof import("../src/modules/scheduling/routes.controller.js").reorderRouteStopsHandler;
let removeRouteStopHandler: typeof import("../src/modules/scheduling/routes.controller.js").removeRouteStopHandler;
let createRoute: MockedFunction<
  typeof import("../src/modules/scheduling/routes.service.js").createRoute
>;
let addRouteStop: MockedFunction<
  typeof import("../src/modules/scheduling/routes.service.js").addRouteStop
>;
let reorderRouteStops: MockedFunction<
  typeof import("../src/modules/scheduling/routes.service.js").reorderRouteStops
>;
let removeRouteStop: MockedFunction<
  typeof import("../src/modules/scheduling/routes.service.js").removeRouteStop
>;

describe("routes.controller", () => {
  beforeAll(async () => {
    ({ createRouteHandler, addRouteStopHandler, reorderRouteStopsHandler, removeRouteStopHandler } =
      await import("../src/modules/scheduling/routes.controller.js"));
    const service = await import("../src/modules/scheduling/routes.service.js");
    createRoute = vi.mocked(service.createRoute);
    addRouteStop = vi.mocked(service.addRouteStop);
    reorderRouteStops = vi.mocked(service.reorderRouteStops);
    removeRouteStop = vi.mocked(service.removeRouteStop);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRes = () =>
    ({
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    }) as unknown as Response;

  test("createRouteHandler returns 201", async () => {
    createRoute.mockResolvedValue({ route: { id: "route-1" } as any });

    const req = {
      body: { crewId: "crew-1", routeDate: "2025-02-01T00:00:00Z" },
      org: { id: "org-1", membershipId: "member-1" },
    } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await createRouteHandler(req, res, next);

    expect(createRoute).toHaveBeenCalledWith("org-1", {
      crewId: "crew-1",
      routeDate: "2025-02-01T00:00:00Z",
    });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test("createRouteHandler requires org", async () => {
    const req = { body: { crewId: "crew-1", routeDate: "2025-02-01T00:00:00Z" } } as Request;
    const res = createRes();
    const next = vi.fn();

    await createRouteHandler(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(createRoute).not.toHaveBeenCalled();
  });

  test("addRouteStopHandler returns 201", async () => {
    addRouteStop.mockResolvedValue({ stop: { id: "stop-1" } as any });

    const req = {
      params: { id: "route-1" },
      body: { bookingId: "booking-1" },
      org: { id: "org-1", membershipId: "member-1" },
    } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await addRouteStopHandler(req, res, next);

    expect(addRouteStop).toHaveBeenCalledWith("org-1", "route-1", { bookingId: "booking-1" });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test("reorderRouteStopsHandler returns 200", async () => {
    reorderRouteStops.mockResolvedValue({ stops: [] });

    const req = {
      params: { id: "route-1" },
      body: { stopIds: ["stop-1", "stop-2"] },
      org: { id: "org-1", membershipId: "member-1" },
    } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await reorderRouteStopsHandler(req, res, next);

    expect(reorderRouteStops).toHaveBeenCalledWith("org-1", "route-1", {
      stopIds: ["stop-1", "stop-2"],
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("removeRouteStopHandler returns 200", async () => {
    removeRouteStop.mockResolvedValue({ deleted: true });

    const req = {
      params: { id: "route-1", stopId: "stop-1" },
      org: { id: "org-1", membershipId: "member-1" },
    } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await removeRouteStopHandler(req, res, next);

    expect(removeRouteStop).toHaveBeenCalledWith("org-1", "route-1", "stop-1");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ deleted: true });
  });

  test("removeRouteStopHandler requires org", async () => {
    const req = { params: { id: "route-1", stopId: "stop-1" } } as Request;
    const res = createRes();
    const next = vi.fn();

    await removeRouteStopHandler(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(removeRouteStop).not.toHaveBeenCalled();
  });
});
