import { Prisma } from "@prisma/client";
import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../src/infrastructure/db/prisma.js", () => {
  return {
    prisma: {
      booking: {
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      bookingStatus: {
        findFirst: vi.fn(),
      },
      bookingStatusEvent: {
        create: vi.fn(),
      },
      crew: {
        findFirst: vi.fn(),
      },
      workOrder: {
        findFirst: vi.fn(),
      },
      $transaction: vi.fn(),
    },
  };
});

let prisma: any;
let createBooking: typeof import("../src/modules/scheduling/bookings.service.js").createBooking;
let updateBooking: typeof import("../src/modules/scheduling/bookings.service.js").updateBooking;
let changeBookingStatus: typeof import("../src/modules/scheduling/bookings.service.js").changeBookingStatus;

describe("bookings.service", () => {
  const prismaUniqueError = (target: string | string[]) =>
    new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
      code: "P2002",
      clientVersion: "test",
      meta: { target },
    });

  beforeAll(async () => {
    ({ prisma } = await import("../src/infrastructure/db/prisma.js"));
    ({ createBooking, updateBooking, changeBookingStatus } =
      await import("../src/modules/scheduling/bookings.service.js"));
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("changeBookingStatus creates status event", async () => {
    prisma.booking.findFirst.mockResolvedValueOnce({ id: "booking-1", statusId: "status-1" });
    prisma.bookingStatus.findFirst.mockResolvedValueOnce({ id: "status-2" });

    const bookingUpdate = vi.fn().mockResolvedValue({
      id: "booking-1",
      workOrderId: null,
      crewId: "crew-1",
      statusId: "status-2",
      scheduledStart: null,
      scheduledEnd: null,
      createdAt: new Date("2025-01-01"),
      updatedAt: new Date("2025-01-02"),
    });

    const eventCreate = vi.fn().mockResolvedValue({
      id: "event-1",
      bookingId: "booking-1",
      statusId: "status-2",
      orgMemberId: "member-1",
      createdAt: new Date("2025-01-02"),
    });

    prisma.$transaction.mockImplementation(async (callback: any) => {
      return callback({
        booking: { update: bookingUpdate },
        bookingStatusEvent: { create: eventCreate },
      });
    });

    const result = await changeBookingStatus(
      "org-1",
      "booking-1",
      { statusId: "status-2" },
      "member-1",
    );

    expect(bookingUpdate).toHaveBeenCalledWith({
      where: { id: "booking-1" },
      data: { statusId: "status-2" },
      select: expect.any(Object),
    });

    expect(eventCreate).toHaveBeenCalledWith({
      data: {
        orgId: "org-1",
        bookingId: "booking-1",
        statusId: "status-2",
        orgMemberId: "member-1",
      },
      select: expect.any(Object),
    });

    expect(result.event?.id).toBe("event-1");
  });

  test("createBooking uses default status and default requirement", async () => {
    prisma.crew.findFirst.mockResolvedValue({ id: "crew-1" });
    prisma.bookingStatus.findFirst.mockResolvedValueOnce({ id: "status-1" });
    prisma.booking.create.mockResolvedValue({
      id: "booking-1",
      workOrderId: null,
      crewId: "crew-1",
      statusId: "status-1",
      scheduledStart: null,
      scheduledEnd: null,
      createdAt: new Date("2025-01-01"),
      updatedAt: new Date("2025-01-01"),
      requirements: [],
    });

    const result = await createBooking("org-1", { crewId: "crew-1" });

    expect(prisma.booking.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        orgId: "org-1",
        crewId: "crew-1",
        statusId: "status-1",
        requirements: {
          create: [{ orgId: "org-1", resourceType: "CREW", quantity: 1, notes: null }],
        },
      }),
      select: expect.any(Object),
    });

    expect(result.booking.id).toBe("booking-1");
  });

  test("createBooking falls back to first active status", async () => {
    prisma.crew.findFirst.mockResolvedValue({ id: "crew-1" });
    prisma.bookingStatus.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "status-2" });
    prisma.booking.create.mockResolvedValue({
      id: "booking-2",
      workOrderId: null,
      crewId: "crew-1",
      statusId: "status-2",
      scheduledStart: null,
      scheduledEnd: null,
      createdAt: new Date("2025-01-01"),
      updatedAt: new Date("2025-01-01"),
      requirements: [],
    });

    await createBooking("org-1", { crewId: "crew-1" });

    expect(prisma.bookingStatus.findFirst).toHaveBeenCalledTimes(2);
  });

  test("createBooking throws when statusId missing", async () => {
    prisma.crew.findFirst.mockResolvedValue({ id: "crew-1" });
    prisma.bookingStatus.findFirst.mockResolvedValueOnce(null);

    await expect(
      createBooking("org-1", { crewId: "crew-1", statusId: "status-missing" }),
    ).rejects.toMatchObject({ statusCode: 404, code: "BOOKING_STATUS_NOT_FOUND" });
  });

  test("createBooking maps unique workOrder conflict", async () => {
    prisma.crew.findFirst.mockResolvedValue({ id: "crew-1" });
    prisma.workOrder.findFirst.mockResolvedValue({ id: "wo-1" });
    prisma.bookingStatus.findFirst.mockResolvedValueOnce({ id: "status-1" });
    prisma.booking.create.mockRejectedValue(prismaUniqueError("workOrderId"));

    await expect(
      createBooking("org-1", { crewId: "crew-1", workOrderId: "wo-1" }),
    ).rejects.toMatchObject({ statusCode: 409, code: "BOOKING_ALREADY_EXISTS" });
  });

  test("updateBooking throws when booking missing", async () => {
    prisma.booking.findFirst.mockResolvedValue(null);

    await expect(updateBooking("org-1", "booking-1", {})).rejects.toMatchObject({
      statusCode: 404,
      code: "BOOKING_NOT_FOUND",
    });
  });

  test("updateBooking applies crew change", async () => {
    prisma.booking.findFirst.mockResolvedValue({ id: "booking-1" });
    prisma.crew.findFirst.mockResolvedValue({ id: "crew-2" });
    prisma.booking.update.mockResolvedValue({
      id: "booking-1",
      workOrderId: null,
      crewId: "crew-2",
      statusId: "status-1",
      scheduledStart: null,
      scheduledEnd: null,
      createdAt: new Date("2025-01-01"),
      updatedAt: new Date("2025-01-02"),
    });

    const result = await updateBooking("org-1", "booking-1", { crewId: "crew-2" });

    expect(prisma.booking.update).toHaveBeenCalledWith({
      where: { id: "booking-1" },
      data: { crew: { connect: { id: "crew-2" } } },
      select: expect.any(Object),
    });
    expect(result.booking.crewId).toBe("crew-2");
  });

  test("changeBookingStatus returns null event when status unchanged", async () => {
    prisma.booking.findFirst
      .mockResolvedValueOnce({ id: "booking-1", statusId: "status-1" })
      .mockResolvedValueOnce({
        id: "booking-1",
        workOrderId: null,
        crewId: "crew-1",
        statusId: "status-1",
        scheduledStart: null,
        scheduledEnd: null,
        createdAt: new Date("2025-01-01"),
        updatedAt: new Date("2025-01-02"),
      });
    prisma.bookingStatus.findFirst.mockResolvedValueOnce({ id: "status-1" });

    const result = await changeBookingStatus("org-1", "booking-1", { statusId: "status-1" });

    expect(result.event).toBeNull();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  test("changeBookingStatus throws when booking missing", async () => {
    prisma.booking.findFirst.mockResolvedValue(null);

    await expect(
      changeBookingStatus("org-1", "booking-1", { statusId: "status-1" }),
    ).rejects.toMatchObject({ statusCode: 404, code: "BOOKING_NOT_FOUND" });
  });
});
