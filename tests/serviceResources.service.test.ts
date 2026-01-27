import { Prisma } from "@prisma/client";
import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../src/infrastructure/db/prisma.js", () => {
  return {
    prisma: {
      serviceResource: {
        count: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        deleteMany: vi.fn(),
      },
      orgMember: {
        findFirst: vi.fn(),
      },
    },
  };
});

let prisma: any;
let listServiceResources: typeof import("../src/modules/service-resources/serviceResources.service.js").listServiceResources;
let createServiceResource: typeof import("../src/modules/service-resources/serviceResources.service.js").createServiceResource;
let getServiceResource: typeof import("../src/modules/service-resources/serviceResources.service.js").getServiceResource;
let updateServiceResource: typeof import("../src/modules/service-resources/serviceResources.service.js").updateServiceResource;
let deleteServiceResource: typeof import("../src/modules/service-resources/serviceResources.service.js").deleteServiceResource;

const prismaUniqueError = (target: string | string[]) =>
  new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
    code: "P2002",
    clientVersion: "test",
    meta: { target },
  });

describe("serviceResources.service", () => {
  beforeAll(async () => {
    ({ prisma } = await import("../src/infrastructure/db/prisma.js"));
    ({
      listServiceResources,
      createServiceResource,
      getServiceResource,
      updateServiceResource,
      deleteServiceResource,
    } = await import("../src/modules/service-resources/serviceResources.service.js"));
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("listServiceResources scopes results to org and query", async () => {
    prisma.serviceResource.count.mockResolvedValue(1);
    prisma.serviceResource.findMany.mockResolvedValue([
      {
        id: "res-1",
        displayName: "Alex",
        email: "alex@example.com",
        phone: null,
        isActive: true,
        orgMemberId: "mem-1",
      },
    ]);

    const result = await listServiceResources("org-1", { q: "alex", page: 1, pageSize: 25 });

    expect(prisma.serviceResource.count).toHaveBeenCalledWith({
      where: {
        orgId: "org-1",
        OR: [
          { displayName: { contains: "alex", mode: "insensitive" } },
          { email: { contains: "alex", mode: "insensitive" } },
        ],
      },
    });
    expect(prisma.serviceResource.findMany).toHaveBeenCalled();
    expect(result).toEqual({
      items: [
        {
          id: "res-1",
          displayName: "Alex",
          email: "alex@example.com",
          phone: null,
          isActive: true,
          orgMemberId: "mem-1",
        },
      ],
      page: 1,
      pageSize: 25,
      total: 1,
    });
  });

  test("createServiceResource rejects unknown org member", async () => {
    prisma.orgMember.findFirst.mockResolvedValue(null);

    await expect(
      createServiceResource("org-1", { displayName: "Alex", orgMemberId: "mem-1" }),
    ).rejects.toMatchObject({ statusCode: 404, code: "ORG_MEMBER_NOT_FOUND" });

    expect(prisma.serviceResource.create).not.toHaveBeenCalled();
  });

  test("getServiceResource returns resource", async () => {
    prisma.serviceResource.findFirst.mockResolvedValue({
      id: "res-1",
      displayName: "Alex",
      email: "alex@example.com",
      phone: null,
      isActive: true,
      orgMemberId: null,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-02"),
    });

    const result = await getServiceResource("org-1", "res-1");

    expect(prisma.serviceResource.findFirst).toHaveBeenCalledWith({
      where: { id: "res-1", orgId: "org-1" },
      select: expect.any(Object),
    });
    expect(result.resource.id).toBe("res-1");
  });

  test("getServiceResource throws when missing", async () => {
    prisma.serviceResource.findFirst.mockResolvedValue(null);

    await expect(getServiceResource("org-1", "res-1")).rejects.toMatchObject({
      statusCode: 404,
      code: "SERVICE_RESOURCE_NOT_FOUND",
    });
  });

  test("createServiceResource creates resource with org member", async () => {
    prisma.orgMember.findFirst.mockResolvedValue({ id: "mem-1" });
    prisma.serviceResource.create.mockResolvedValue({
      id: "res-2",
      displayName: "Jamie",
      email: null,
      phone: null,
      isActive: true,
      orgMemberId: "mem-1",
      createdAt: new Date("2024-01-03"),
      updatedAt: new Date("2024-01-04"),
    });

    const result = await createServiceResource("org-1", {
      displayName: "Jamie",
      orgMemberId: "mem-1",
    });

    expect(prisma.serviceResource.create).toHaveBeenCalledWith({
      data: {
        org: { connect: { id: "org-1" } },
        displayName: "Jamie",
        email: null,
        phone: null,
        orgMember: { connect: { id: "mem-1" } },
        isActive: true,
      },
      select: expect.any(Object),
    });
    expect(result.resource.id).toBe("res-2");
  });

  test("createServiceResource maps unique constraint to ORG_MEMBER_ASSIGNED", async () => {
    prisma.serviceResource.create.mockRejectedValue(prismaUniqueError("orgMemberId"));

    await expect(createServiceResource("org-1", { displayName: "Jamie" })).rejects.toMatchObject({
      statusCode: 409,
      code: "ORG_MEMBER_ASSIGNED",
    });
  });

  test("updateServiceResource throws when missing", async () => {
    prisma.serviceResource.findFirst.mockResolvedValue(null);

    await expect(
      updateServiceResource("org-1", "res-1", { displayName: "Alex" }),
    ).rejects.toMatchObject({
      statusCode: 404,
      code: "SERVICE_RESOURCE_NOT_FOUND",
    });
  });

  test("updateServiceResource disconnects org member when null", async () => {
    prisma.serviceResource.findFirst.mockResolvedValue({ id: "res-1" });
    prisma.serviceResource.update.mockResolvedValue({
      id: "res-1",
      displayName: "Alex",
      email: "alex@example.com",
      phone: null,
      isActive: true,
      orgMemberId: null,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-02"),
    });

    await updateServiceResource("org-1", "res-1", { orgMemberId: null });

    expect(prisma.serviceResource.update).toHaveBeenCalledWith({
      where: { id: "res-1" },
      data: { orgMember: { disconnect: true } },
      select: expect.any(Object),
    });
  });

  test("updateServiceResource connects org member", async () => {
    prisma.serviceResource.findFirst.mockResolvedValue({ id: "res-1" });
    prisma.orgMember.findFirst.mockResolvedValue({ id: "mem-2" });
    prisma.serviceResource.update.mockResolvedValue({
      id: "res-1",
      displayName: "Alex",
      email: "alex@example.com",
      phone: null,
      isActive: true,
      orgMemberId: "mem-2",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-02"),
    });

    await updateServiceResource("org-1", "res-1", { orgMemberId: "mem-2" });

    expect(prisma.serviceResource.update).toHaveBeenCalledWith({
      where: { id: "res-1" },
      data: { orgMember: { connect: { id: "mem-2" } } },
      select: expect.any(Object),
    });
  });

  test("updateServiceResource maps unique constraint to ORG_MEMBER_ASSIGNED", async () => {
    prisma.serviceResource.findFirst.mockResolvedValue({ id: "res-1" });
    prisma.serviceResource.update.mockRejectedValue(prismaUniqueError("orgMemberId"));

    await expect(
      updateServiceResource("org-1", "res-1", { displayName: "Alex" }),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "ORG_MEMBER_ASSIGNED",
    });
  });

  test("deleteServiceResource throws when missing", async () => {
    prisma.serviceResource.deleteMany.mockResolvedValue({ count: 0 });

    await expect(deleteServiceResource("org-1", "res-1")).rejects.toMatchObject({
      statusCode: 404,
      code: "SERVICE_RESOURCE_NOT_FOUND",
    });
  });

  test("deleteServiceResource deletes when found", async () => {
    prisma.serviceResource.deleteMany.mockResolvedValue({ count: 1 });

    const result = await deleteServiceResource("org-1", "res-1");

    expect(prisma.serviceResource.deleteMany).toHaveBeenCalledWith({
      where: { id: "res-1", orgId: "org-1" },
    });
    expect(result).toEqual({ deleted: true });
  });
});
