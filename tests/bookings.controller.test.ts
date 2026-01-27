import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import type { MockedFunction } from "vitest";
import type { Request, Response } from "express";

vi.mock("../src/modules/scheduling/bookings.service.js", () => ({
  createBooking: vi.fn(),
  updateBooking: vi.fn(),
  changeBookingStatus: vi.fn(),
}));

let createBookingHandler: typeof import("../src/modules/scheduling/bookings.controller.js").createBookingHandler;
let updateBookingHandler: typeof import("../src/modules/scheduling/bookings.controller.js").updateBookingHandler;
let changeBookingStatusHandler: typeof import("../src/modules/scheduling/bookings.controller.js").changeBookingStatusHandler;
let createBooking: MockedFunction<
  typeof import("../src/modules/scheduling/bookings.service.js").createBooking
>;
let updateBooking: MockedFunction<
  typeof import("../src/modules/scheduling/bookings.service.js").updateBooking
>;
let changeBookingStatus: MockedFunction<
  typeof import("../src/modules/scheduling/bookings.service.js").changeBookingStatus
>;

describe("bookings.controller", () => {
  beforeAll(async () => {
    ({ createBookingHandler, updateBookingHandler, changeBookingStatusHandler } =
      await import("../src/modules/scheduling/bookings.controller.js"));
    const service = await import("../src/modules/scheduling/bookings.service.js");
    createBooking = vi.mocked(service.createBooking);
    updateBooking = vi.mocked(service.updateBooking);
    changeBookingStatus = vi.mocked(service.changeBookingStatus);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRes = () =>
    ({
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    }) as unknown as Response;

  test("createBookingHandler returns 201", async () => {
    createBooking.mockResolvedValue({ booking: { id: "booking-1" } as any });

    const req = {
      body: { crewId: "crew-1" },
      org: { id: "org-1", membershipId: "member-1" },
    } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await createBookingHandler(req, res, next);

    expect(createBooking).toHaveBeenCalledWith("org-1", { crewId: "crew-1" });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ booking: { id: "booking-1" } });
  });

  test("createBookingHandler requires org", async () => {
    const req = { body: { crewId: "crew-1" } } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await createBookingHandler(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(createBooking).not.toHaveBeenCalled();
  });

  test("updateBookingHandler returns 200", async () => {
    updateBooking.mockResolvedValue({ booking: { id: "booking-1" } as any });

    const req = {
      params: { id: "booking-1" },
      body: { scheduledEnd: "2025-01-02T00:00:00Z" },
      org: { id: "org-1", membershipId: "member-1" },
    } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await updateBookingHandler(req, res, next);

    expect(updateBooking).toHaveBeenCalledWith("org-1", "booking-1", {
      scheduledEnd: "2025-01-02T00:00:00Z",
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("changeBookingStatusHandler returns 200", async () => {
    changeBookingStatus.mockResolvedValue({ booking: { id: "booking-1" } as any, event: null });

    const req = {
      params: { id: "booking-1" },
      body: { statusId: "status-1" },
      org: { id: "org-1", membershipId: "member-1" },
    } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await changeBookingStatusHandler(req, res, next);

    expect(changeBookingStatus).toHaveBeenCalledWith(
      "org-1",
      "booking-1",
      { statusId: "status-1" },
      "member-1",
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("changeBookingStatusHandler requires org", async () => {
    const req = { params: { id: "booking-1" }, body: { statusId: "status-1" } } as Request;
    const res = createRes();
    const next = vi.fn();

    await changeBookingStatusHandler(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(changeBookingStatus).not.toHaveBeenCalled();
  });
});
