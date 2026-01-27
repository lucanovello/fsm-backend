import { Prisma } from "@prisma/client";
import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../src/infrastructure/db/prisma.js", () => {
  return {
    prisma: {
      crew: {
        count: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        deleteMany: vi.fn(),
      },
      crewMember: {
        upsert: vi.fn(),
        deleteMany: vi.fn(),
      },
      serviceResource: {
        findFirst: vi.fn(),
      },
    },
  };
});

let prisma: any;
let listCrews: typeof import("../src/modules/crews/crews.service.js").listCrews;
let getCrewDetail: typeof import("../src/modules/crews/crews.service.js").getCrewDetail;
let createCrew: typeof import("../src/modules/crews/crews.service.js").createCrew;
let updateCrew: typeof import("../src/modules/crews/crews.service.js").updateCrew;
let deleteCrew: typeof import("../src/modules/crews/crews.service.js").deleteCrew;
let addCrewMember: typeof import("../src/modules/crews/crews.service.js").addCrewMember;
let removeCrewMember: typeof import("../src/modules/crews/crews.service.js").removeCrewMember;

const prismaUniqueError = (target: string | string[]) =>
  new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
    code: "P2002",
    clientVersion: "test",
    meta: { target },
  });

describe("crews.service", () => {
  beforeAll(async () => {
    ({ prisma } = await import("../src/infrastructure/db/prisma.js"));
    ({
      listCrews,
      getCrewDetail,
      createCrew,
      updateCrew,
      deleteCrew,
      addCrewMember,
      removeCrewMember,
    } = await import("../src/modules/crews/crews.service.js"));
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("listCrews returns member counts", async () => {
    prisma.crew.count.mockResolvedValue(1);
    prisma.crew.findMany.mockResolvedValue([
      { id: "crew-1", name: "Alpha", description: null, _count: { members: 2 } },
    ]);

    const result = await listCrews("org-1", { page: 1, pageSize: 25 });

    expect(prisma.crew.count).toHaveBeenCalledWith({ where: { orgId: "org-1" } });
    expect(prisma.crew.findMany).toHaveBeenCalled();
    expect(result).toEqual({
      items: [{ id: "crew-1", name: "Alpha", description: null, memberCount: 2 }],
      page: 1,
      pageSize: 25,
      total: 1,
    });
  });

  test("getCrewDetail returns crew with members", async () => {
    prisma.crew.findFirst.mockResolvedValue({
      id: "crew-1",
      name: "Alpha",
      description: "A",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-02"),
      members: [
        {
          id: "member-1",
          resource: {
            id: "res-1",
            displayName: "Alex",
            email: "alex@example.com",
            phone: null,
            isActive: true,
          },
        },
      ],
    });

    const result = await getCrewDetail("org-1", "crew-1");

    expect(prisma.crew.findFirst).toHaveBeenCalledWith({
      where: { id: "crew-1", orgId: "org-1" },
      select: expect.any(Object),
    });
    expect(result).toEqual({
      crew: {
        id: "crew-1",
        name: "Alpha",
        description: "A",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-02"),
        members: [
          {
            id: "member-1",
            resource: {
              id: "res-1",
              displayName: "Alex",
              email: "alex@example.com",
              phone: null,
              isActive: true,
            },
          },
        ],
      },
    });
  });

  test("getCrewDetail throws when crew missing", async () => {
    prisma.crew.findFirst.mockResolvedValue(null);

    await expect(getCrewDetail("org-1", "crew-1")).rejects.toMatchObject({
      statusCode: 404,
      code: "CREW_NOT_FOUND",
    });
  });

  test("createCrew creates crew", async () => {
    prisma.crew.create.mockResolvedValue({
      id: "crew-2",
      name: "Beta",
      description: null,
      createdAt: new Date("2024-01-03"),
      updatedAt: new Date("2024-01-04"),
    });

    const result = await createCrew("org-1", { name: "Beta" });

    expect(prisma.crew.create).toHaveBeenCalledWith({
      data: { orgId: "org-1", name: "Beta", description: null },
      select: expect.any(Object),
    });
    expect(result).toEqual({
      crew: {
        id: "crew-2",
        name: "Beta",
        description: null,
        createdAt: new Date("2024-01-03"),
        updatedAt: new Date("2024-01-04"),
      },
    });
  });

  test("createCrew maps unique constraint to CREW_NAME_TAKEN", async () => {
    prisma.crew.create.mockRejectedValue(prismaUniqueError(["orgId", "name"]));

    await expect(createCrew("org-1", { name: "Beta" })).rejects.toMatchObject({
      statusCode: 409,
      code: "CREW_NAME_TAKEN",
    });
  });

  test("updateCrew throws when crew missing", async () => {
    prisma.crew.findFirst.mockResolvedValue(null);

    await expect(updateCrew("org-1", "crew-1", { name: "Alpha" })).rejects.toMatchObject({
      statusCode: 404,
      code: "CREW_NOT_FOUND",
    });
    expect(prisma.crew.update).not.toHaveBeenCalled();
  });

  test("updateCrew updates fields", async () => {
    prisma.crew.findFirst.mockResolvedValue({ id: "crew-1" });
    prisma.crew.update.mockResolvedValue({
      id: "crew-1",
      name: "Alpha",
      description: "Updated",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-05"),
    });

    const result = await updateCrew("org-1", "crew-1", { description: "Updated" });

    expect(prisma.crew.update).toHaveBeenCalledWith({
      where: { id: "crew-1" },
      data: { description: "Updated" },
      select: expect.any(Object),
    });
    expect(result.crew.description).toBe("Updated");
  });

  test("updateCrew maps unique constraint to CREW_NAME_TAKEN", async () => {
    prisma.crew.findFirst.mockResolvedValue({ id: "crew-1" });
    prisma.crew.update.mockRejectedValue(prismaUniqueError("name"));

    await expect(updateCrew("org-1", "crew-1", { name: "Alpha" })).rejects.toMatchObject({
      statusCode: 409,
      code: "CREW_NAME_TAKEN",
    });
  });

  test("deleteCrew throws when crew missing", async () => {
    prisma.crew.deleteMany.mockResolvedValue({ count: 0 });

    await expect(deleteCrew("org-1", "crew-1")).rejects.toMatchObject({
      statusCode: 404,
      code: "CREW_NOT_FOUND",
    });
  });

  test("deleteCrew deletes when found", async () => {
    prisma.crew.deleteMany.mockResolvedValue({ count: 1 });

    const result = await deleteCrew("org-1", "crew-1");

    expect(prisma.crew.deleteMany).toHaveBeenCalledWith({
      where: { id: "crew-1", orgId: "org-1" },
    });
    expect(result).toEqual({ deleted: true });
  });

  test("addCrewMember requires crew and resource", async () => {
    prisma.crew.findFirst.mockResolvedValue(null);

    await expect(addCrewMember("org-1", "crew-1", { resourceId: "res-1" })).rejects.toMatchObject({
      statusCode: 404,
      code: "CREW_NOT_FOUND",
    });

    expect(prisma.crewMember.upsert).not.toHaveBeenCalled();
  });

  test("addCrewMember requires resource", async () => {
    prisma.crew.findFirst.mockResolvedValue({ id: "crew-1" });
    prisma.serviceResource.findFirst.mockResolvedValue(null);

    await expect(addCrewMember("org-1", "crew-1", { resourceId: "res-1" })).rejects.toMatchObject({
      statusCode: 404,
      code: "SERVICE_RESOURCE_NOT_FOUND",
    });

    expect(prisma.crewMember.upsert).not.toHaveBeenCalled();
  });

  test("addCrewMember upserts member", async () => {
    prisma.crew.findFirst.mockResolvedValue({ id: "crew-1" });
    prisma.serviceResource.findFirst.mockResolvedValue({ id: "res-1" });
    prisma.crewMember.upsert.mockResolvedValue({
      id: "member-1",
      crewId: "crew-1",
      resource: {
        id: "res-1",
        displayName: "Alex",
        email: "alex@example.com",
        phone: null,
        isActive: true,
      },
    });

    const result = await addCrewMember("org-1", "crew-1", { resourceId: "res-1" });

    expect(prisma.crewMember.upsert).toHaveBeenCalledWith({
      where: { orgId_crewId_resourceId: { orgId: "org-1", crewId: "crew-1", resourceId: "res-1" } },
      update: {},
      create: { orgId: "org-1", crewId: "crew-1", resourceId: "res-1" },
      select: expect.any(Object),
    });
    expect(result.member.id).toBe("member-1");
  });

  test("removeCrewMember throws when missing", async () => {
    prisma.crewMember.deleteMany.mockResolvedValue({ count: 0 });

    await expect(removeCrewMember("org-1", "crew-1", "res-1")).rejects.toMatchObject({
      statusCode: 404,
      code: "CREW_MEMBER_NOT_FOUND",
    });
  });

  test("removeCrewMember deletes when found", async () => {
    prisma.crewMember.deleteMany.mockResolvedValue({ count: 1 });

    const result = await removeCrewMember("org-1", "crew-1", "res-1");

    expect(prisma.crewMember.deleteMany).toHaveBeenCalledWith({
      where: { orgId: "org-1", crewId: "crew-1", resourceId: "res-1" },
    });
    expect(result).toEqual({ deleted: true });
  });
});
