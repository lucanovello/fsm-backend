import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import type { MockedFunction } from "vitest";
import type { Request, Response } from "express";

vi.mock("../src/modules/geo-tracking/geoTracking.service.js", () => ({
  createGeoDevice: vi.fn(),
  ingestGeoPings: vi.fn(),
  getLatestGeoPing: vi.fn(),
  listGeoPingsForResource: vi.fn(),
}));

let createGeoDeviceHandler: typeof import("../src/modules/geo-tracking/geoTracking.controller.js").createGeoDeviceHandler;
let ingestGeoPingsHandler: typeof import("../src/modules/geo-tracking/geoTracking.controller.js").ingestGeoPingsHandler;
let getLatestGeoPingHandler: typeof import("../src/modules/geo-tracking/geoTracking.controller.js").getLatestGeoPingHandler;
let listGeoPingsHandler: typeof import("../src/modules/geo-tracking/geoTracking.controller.js").listGeoPingsHandler;

let createGeoDevice: MockedFunction<
  typeof import("../src/modules/geo-tracking/geoTracking.service.js").createGeoDevice
>;
let ingestGeoPings: MockedFunction<
  typeof import("../src/modules/geo-tracking/geoTracking.service.js").ingestGeoPings
>;
let getLatestGeoPing: MockedFunction<
  typeof import("../src/modules/geo-tracking/geoTracking.service.js").getLatestGeoPing
>;
let listGeoPingsForResource: MockedFunction<
  typeof import("../src/modules/geo-tracking/geoTracking.service.js").listGeoPingsForResource
>;

describe("geoTracking.controller", () => {
  beforeAll(async () => {
    ({
      createGeoDeviceHandler,
      ingestGeoPingsHandler,
      getLatestGeoPingHandler,
      listGeoPingsHandler,
    } = await import("../src/modules/geo-tracking/geoTracking.controller.js"));

    const service = await import("../src/modules/geo-tracking/geoTracking.service.js");
    createGeoDevice = vi.mocked(service.createGeoDevice);
    ingestGeoPings = vi.mocked(service.ingestGeoPings);
    getLatestGeoPing = vi.mocked(service.getLatestGeoPing);
    listGeoPingsForResource = vi.mocked(service.listGeoPingsForResource);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRes = () =>
    ({
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    }) as unknown as Response;

  test("createGeoDeviceHandler returns 201", async () => {
    createGeoDevice.mockResolvedValue({ device: { id: "geo-1" } as any });

    const req = {
      body: { serviceResourceId: "res-1", deviceIdentifier: "dev-1" },
      org: { id: "org-1", membershipId: "member-1" },
    } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await createGeoDeviceHandler(req, res, next);

    expect(createGeoDevice).toHaveBeenCalledWith("org-1", {
      serviceResourceId: "res-1",
      deviceIdentifier: "dev-1",
    });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test("ingestGeoPingsHandler returns 202", async () => {
    ingestGeoPings.mockResolvedValue({ inserted: 1 });

    const req = {
      body: {
        pings: [
          {
            deviceId: "dev-1",
            recordedAt: "2025-01-01T10:00:00Z",
            latitude: 10,
            longitude: 20,
          },
        ],
      },
      org: { id: "org-1", membershipId: "member-1" },
    } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await ingestGeoPingsHandler(req, res, next);

    expect(ingestGeoPings).toHaveBeenCalledWith("org-1", req.body);
    expect(res.status).toHaveBeenCalledWith(202);
  });

  test("getLatestGeoPingHandler returns 200", async () => {
    getLatestGeoPing.mockResolvedValue({ ping: null });

    const req = {
      params: { resourceId: "res-1" },
      org: { id: "org-1", membershipId: "member-1" },
    } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await getLatestGeoPingHandler(req, res, next);

    expect(getLatestGeoPing).toHaveBeenCalledWith("org-1", "res-1");
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("listGeoPingsHandler returns 200", async () => {
    listGeoPingsForResource.mockResolvedValue({ items: [], count: 0 });

    const req = {
      params: { resourceId: "res-1" },
      query: { limit: "50" },
      org: { id: "org-1", membershipId: "member-1" },
    } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await listGeoPingsHandler(req, res, next);

    expect(listGeoPingsForResource).toHaveBeenCalledWith("org-1", "res-1", {
      limit: 50,
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("handlers require org", async () => {
    const req = { body: {} } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await ingestGeoPingsHandler(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(ingestGeoPings).not.toHaveBeenCalled();
  });

  test("createGeoDeviceHandler requires org", async () => {
    const req = { body: { serviceResourceId: "res-1", deviceIdentifier: "dev-1" } } as Request;
    const res = createRes();
    const next = vi.fn();

    await createGeoDeviceHandler(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(createGeoDevice).not.toHaveBeenCalled();
  });

  test("getLatestGeoPingHandler requires org", async () => {
    const req = { params: { resourceId: "res-1" } } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await getLatestGeoPingHandler(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(getLatestGeoPing).not.toHaveBeenCalled();
  });

  test("listGeoPingsHandler requires org", async () => {
    const req = { params: { resourceId: "res-1" } } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await listGeoPingsHandler(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(listGeoPingsForResource).not.toHaveBeenCalled();
  });
});
