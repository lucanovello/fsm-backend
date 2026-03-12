import { Prisma } from "@prisma/client";
import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../src/infrastructure/db/prisma.js", () => {
  return {
    prisma: {
      $transaction: vi.fn(),
      serviceResource: {
        findFirst: vi.fn(),
      },
      skill: {
        count: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        deleteMany: vi.fn(),
      },
      resourceSkill: {
        findMany: vi.fn(),
        deleteMany: vi.fn(),
        createMany: vi.fn(),
      },
    },
  };
});

let prisma: any;
let listSkills: typeof import("../src/modules/skills/skills.service.js").listSkills;
let getSkill: typeof import("../src/modules/skills/skills.service.js").getSkill;
let createSkill: typeof import("../src/modules/skills/skills.service.js").createSkill;
let deleteSkill: typeof import("../src/modules/skills/skills.service.js").deleteSkill;
let replaceResourceSkills: typeof import("../src/modules/skills/skills.service.js").replaceResourceSkills;

const prismaUniqueError = (target: string | string[]) =>
  new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
    code: "P2002",
    clientVersion: "test",
    meta: { target },
  });

const prismaForeignKeyError = () =>
  new Prisma.PrismaClientKnownRequestError("Foreign key failed", {
    code: "P2003",
    clientVersion: "test",
  });

describe("skills.service", () => {
  beforeAll(async () => {
    ({ prisma } = await import("../src/infrastructure/db/prisma.js"));
    ({ listSkills, getSkill, createSkill, deleteSkill, replaceResourceSkills } = await import(
      "../src/modules/skills/skills.service.js"
    ));
  });

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.$transaction.mockImplementation(async (callback: any) => callback(prisma));
  });

  test("listSkills maps resourceCount from _count", async () => {
    prisma.skill.count.mockResolvedValue(1);
    prisma.skill.findMany.mockResolvedValue([
      {
        id: "skill-1",
        name: "HVAC",
        description: "Heating and cooling",
        createdAt: new Date("2025-01-01"),
        updatedAt: new Date("2025-01-02"),
        _count: { resources: 3 },
      },
    ]);

    const result = await listSkills("org-1", { q: "hvac", page: 1, pageSize: 25 });

    expect(prisma.skill.count).toHaveBeenCalledWith({
      where: {
        orgId: "org-1",
        OR: [
          { name: { contains: "hvac", mode: "insensitive" } },
          { description: { contains: "hvac", mode: "insensitive" } },
        ],
      },
    });
    expect(result.items[0]?.resourceCount).toBe(3);
  });

  test("getSkill throws when missing", async () => {
    prisma.skill.findFirst.mockResolvedValue(null);

    await expect(getSkill("org-1", "skill-1")).rejects.toMatchObject({
      statusCode: 404,
      code: "SKILL_NOT_FOUND",
    });
  });

  test("createSkill maps unique constraint to SKILL_NAME_TAKEN", async () => {
    prisma.skill.create.mockRejectedValue(prismaUniqueError("name"));

    await expect(createSkill("org-1", { name: "HVAC" })).rejects.toMatchObject({
      statusCode: 409,
      code: "SKILL_NAME_TAKEN",
    });
  });

  test("deleteSkill maps foreign-key failures to SKILL_IN_USE", async () => {
    prisma.skill.deleteMany.mockRejectedValue(prismaForeignKeyError());

    await expect(deleteSkill("org-1", "skill-1")).rejects.toMatchObject({
      statusCode: 409,
      code: "SKILL_IN_USE",
    });
  });

  test("replaceResourceSkills rewrites assignments and deduplicates skillIds", async () => {
    prisma.serviceResource.findFirst.mockResolvedValue({ id: "res-1" });
    prisma.skill.count.mockResolvedValue(2);
    prisma.resourceSkill.findMany.mockResolvedValue([
      {
        id: "rs-1",
        skillId: "skill-1",
        createdAt: new Date("2025-01-01"),
        skill: { id: "skill-1", name: "HVAC", description: null },
      },
      {
        id: "rs-2",
        skillId: "skill-2",
        createdAt: new Date("2025-01-01"),
        skill: { id: "skill-2", name: "Electrical", description: "Certified electrical repair" },
      },
    ]);

    const result = await replaceResourceSkills("org-1", "res-1", {
      skillIds: ["skill-1", "skill-2", "skill-1"],
    });

    expect(prisma.resourceSkill.deleteMany).toHaveBeenCalledWith({
      where: { orgId: "org-1", resourceId: "res-1" },
    });
    expect(prisma.resourceSkill.createMany).toHaveBeenCalledWith({
      data: [
        { orgId: "org-1", resourceId: "res-1", skillId: "skill-1" },
        { orgId: "org-1", resourceId: "res-1", skillId: "skill-2" },
      ],
      skipDuplicates: true,
    });
    expect(result.resourceId).toBe("res-1");
    expect(result.skills).toHaveLength(2);
  });

  test("replaceResourceSkills rejects unknown skill ids", async () => {
    prisma.serviceResource.findFirst.mockResolvedValue({ id: "res-1" });
    prisma.skill.count.mockResolvedValue(1);

    await expect(
      replaceResourceSkills("org-1", "res-1", { skillIds: ["skill-1", "skill-2"] }),
    ).rejects.toMatchObject({
      statusCode: 404,
      code: "SKILL_NOT_FOUND",
    });
  });
});
