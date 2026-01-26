import { Prisma } from "@prisma/client";
import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../src/infrastructure/db/prisma.js", () => {
  return {
    prisma: {
      orgMember: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
      organization: {
        create: vi.fn(),
      },
      $transaction: vi.fn(),
    },
  };
});

vi.mock("../src/modules/rbac/rbac.service.js", () => ({
  ensureSystemRoles: vi.fn(),
  assignSystemRoleToMember: vi.fn(),
}));

let prisma: any;
let listOrganizations: typeof import("../src/modules/organizations/organizations.service.js").listOrganizations;
let createOrganization: typeof import("../src/modules/organizations/organizations.service.js").createOrganization;
let ensureSystemRoles: typeof import("../src/modules/rbac/rbac.service.js").ensureSystemRoles;
let assignSystemRoleToMember: typeof import("../src/modules/rbac/rbac.service.js").assignSystemRoleToMember;

const prismaUniqueError = (target: string | string[]) =>
  new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
    code: "P2002",
    clientVersion: "test",
    meta: { target },
  });

describe("organizations.service", () => {
  beforeAll(async () => {
    ({ prisma } = await import("../src/infrastructure/db/prisma.js"));
    ({ ensureSystemRoles, assignSystemRoleToMember } =
      await import("../src/modules/rbac/rbac.service.js"));
    ({ listOrganizations, createOrganization } =
      await import("../src/modules/organizations/organizations.service.js"));
  });

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.$transaction.mockImplementation(async (fn: any) => fn(prisma));
  });

  test("listOrganizations returns orgs for the user", async () => {
    prisma.orgMember.findMany.mockResolvedValue([
      { role: "OWNER", org: { id: "org-1", name: "Acme", slug: "acme" } },
      { role: "MEMBER", org: { id: "org-2", name: "Beta", slug: "beta" } },
    ]);

    const result = await listOrganizations("user-1");

    expect(prisma.orgMember.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      select: { role: true, org: { select: { id: true, name: true, slug: true } } },
      orderBy: { org: { name: "asc" } },
    });

    expect(result).toEqual({
      items: [
        { id: "org-1", name: "Acme", slug: "acme", role: "OWNER" },
        { id: "org-2", name: "Beta", slug: "beta", role: "MEMBER" },
      ],
      count: 2,
    });
  });

  test("createOrganization creates org with owner membership", async () => {
    prisma.organization.create.mockResolvedValue({
      id: "org-123",
      name: "Acme Services",
      slug: "acme-services",
    });
    prisma.orgMember.create.mockResolvedValue({ id: "member-1" });

    const result = await createOrganization("user-1", { name: "Acme Services" });

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.organization.create).toHaveBeenCalledWith({
      data: {
        name: "Acme Services",
        slug: "acme-services",
      },
      select: { id: true, name: true, slug: true },
    });
    expect(prisma.orgMember.create).toHaveBeenCalledWith({
      data: {
        orgId: "org-123",
        userId: "user-1",
        role: "OWNER",
      },
      select: { id: true },
    });
    expect(ensureSystemRoles).toHaveBeenCalledWith(prisma, "org-123");
    expect(assignSystemRoleToMember).toHaveBeenCalledWith(prisma, "member-1", "org-123", "OWNER");

    expect(result).toEqual({
      organization: {
        id: "org-123",
        name: "Acme Services",
        slug: "acme-services",
        role: "OWNER",
      },
    });
  });

  test("createOrganization retries slug when unique constraint hit", async () => {
    prisma.organization.create
      .mockRejectedValueOnce(prismaUniqueError(["slug"]))
      .mockResolvedValueOnce({
        id: "org-456",
        name: "Acme Services",
        slug: "acme-services-xyz",
      });
    prisma.orgMember.create.mockResolvedValue({ id: "member-1" });

    const result = await createOrganization("user-1", { name: "Acme Services" });

    expect(prisma.organization.create).toHaveBeenCalledTimes(2);
    expect(prisma.organization.create.mock.calls[0][0].data.slug).toBe("acme-services");
    expect(prisma.organization.create.mock.calls[1][0].data.slug).toMatch(
      /^acme-services-[a-z0-9]{8}$/,
    );
    expect(result).toEqual({
      organization: {
        id: "org-456",
        name: "Acme Services",
        slug: "acme-services-xyz",
        role: "OWNER",
      },
    });
  });

  test("createOrganization falls back to default slug base", async () => {
    prisma.organization.create.mockResolvedValue({
      id: "org-789",
      name: "!!!",
      slug: "org",
    });
    prisma.orgMember.create.mockResolvedValue({ id: "member-1" });

    const result = await createOrganization("user-1", { name: "!!!" });

    expect(prisma.organization.create).toHaveBeenCalledWith({
      data: {
        name: "!!!",
        slug: "org",
      },
      select: { id: true, name: true, slug: true },
    });
    expect(result.organization.slug).toBe("org");
  });

  test("createOrganization throws when slug stays unavailable", async () => {
    prisma.organization.create
      .mockRejectedValueOnce(prismaUniqueError("slug"))
      .mockRejectedValueOnce(prismaUniqueError(["slug"]))
      .mockRejectedValueOnce(prismaUniqueError("slug"));

    await expect(createOrganization("user-1", { name: "Acme" })).rejects.toMatchObject({
      statusCode: 409,
      code: "ORG_SLUG_TAKEN",
    });
  });

  test("createOrganization rethrows non-slug unique errors", async () => {
    const err = prismaUniqueError(["name"]);
    prisma.organization.create.mockRejectedValue(err);

    await expect(createOrganization("user-1", { name: "Acme" })).rejects.toBe(err);
  });
});
