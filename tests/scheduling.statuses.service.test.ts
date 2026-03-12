import { Prisma } from "@prisma/client";
import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../src/infrastructure/db/prisma.js", () => {
  return {
    prisma: {
      $transaction: vi.fn(),
      bookingStatus: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        updateMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
    },
  };
});

let prisma: any;
let listBookingStatuses: typeof import("../src/modules/scheduling/statuses.service.js").listBookingStatuses;
let createBookingStatus: typeof import("../src/modules/scheduling/statuses.service.js").createBookingStatus;
let updateBookingStatus: typeof import("../src/modules/scheduling/statuses.service.js").updateBookingStatus;

const prismaUniqueError = (target: string | string[]) =>
  new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
    code: "P2002",
    clientVersion: "test",
    meta: { target },
  });

describe("scheduling.statuses.service", () => {
  beforeAll(async () => {
    ({ prisma } = await import("../src/infrastructure/db/prisma.js"));
    ({ listBookingStatuses, createBookingStatus, updateBookingStatus } = await import(
      "../src/modules/scheduling/statuses.service.js"
    ));
  });

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.$transaction.mockImplementation(async (callback: any) => callback(prisma));
  });

  test("listBookingStatuses excludes inactive statuses by default", async () => {
    prisma.bookingStatus.findMany.mockResolvedValue([]);

    await listBookingStatuses("org-1", { includeInactive: false });

    expect(prisma.bookingStatus.findMany).toHaveBeenCalledWith({
      where: { orgId: "org-1", isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: expect.any(Object),
    });
  });

  test("createBookingStatus clears previous default when new default is created", async () => {
    prisma.bookingStatus.create.mockResolvedValue({
      id: "status-1",
      name: "Dispatched",
      description: null,
      isDefault: true,
      isActive: true,
      sortOrder: 5,
      createdAt: new Date("2025-01-01"),
      updatedAt: new Date("2025-01-01"),
    });

    const result = await createBookingStatus("org-1", {
      name: "Dispatched",
      isDefault: true,
      isActive: true,
      sortOrder: 5,
    });

    expect(prisma.bookingStatus.updateMany).toHaveBeenCalledWith({
      where: { orgId: "org-1", isDefault: true },
      data: { isDefault: false },
    });
    expect(result.status.isDefault).toBe(true);
  });

  test("createBookingStatus maps unique conflicts to BOOKING_STATUS_NAME_TAKEN", async () => {
    prisma.bookingStatus.create.mockRejectedValue(prismaUniqueError("name"));

    await expect(createBookingStatus("org-1", { name: "Scheduled" })).rejects.toMatchObject({
      statusCode: 409,
      code: "BOOKING_STATUS_NAME_TAKEN",
    });
  });

  test("updateBookingStatus throws when status is missing", async () => {
    prisma.bookingStatus.findFirst.mockResolvedValue(null);

    await expect(updateBookingStatus("org-1", "status-missing", { name: "Scheduled" })).rejects.toMatchObject(
      {
        statusCode: 404,
        code: "BOOKING_STATUS_NOT_FOUND",
      },
    );
  });
});
