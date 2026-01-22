import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../src/infrastructure/db/prisma.js", () => {
  return {
    prisma: {
      technician: {
        count: vi.fn(),
        findMany: vi.fn(),
      },
    },
  };
});

let prisma: any;
let listTechnicians: typeof import("../src/modules/technicians/technicians.service.js").listTechnicians;

describe("technicians.service", () => {
  beforeAll(async () => {
    ({ prisma } = await import("../src/infrastructure/db/prisma.js"));
    ({ listTechnicians } = await import("../src/modules/technicians/technicians.service.js"));
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("listTechnicians shapes results with user email", async () => {
    prisma.technician.count.mockResolvedValue(2);
    prisma.technician.findMany.mockResolvedValue([
      {
        id: "t1",
        displayName: "Alex Tech",
        phone: "555-1111",
        user: { email: "alex@example.com" },
      },
      {
        id: "t2",
        displayName: "Jamie Tech",
        phone: null,
        user: { email: "jamie@example.com" },
      },
    ]);

    const result = await listTechnicians({ page: 1, pageSize: 25 });

    expect(prisma.technician.count).toHaveBeenCalledWith();
    expect(prisma.technician.findMany).toHaveBeenCalledWith({
      skip: 0,
      take: 25,
      orderBy: { displayName: "asc" },
      select: {
        id: true,
        displayName: true,
        phone: true,
        user: { select: { email: true } },
      },
    });

    expect(result).toEqual({
      items: [
        {
          id: "t1",
          displayName: "Alex Tech",
          email: "alex@example.com",
          phone: "555-1111",
        },
        {
          id: "t2",
          displayName: "Jamie Tech",
          email: "jamie@example.com",
          phone: null,
        },
      ],
      page: 1,
      pageSize: 25,
      total: 2,
    });
  });
});
