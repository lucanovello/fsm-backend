import { Prisma } from "@prisma/client";
import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../src/infrastructure/db/prisma.js", () => {
  return {
    prisma: {
      workTemplate: {
        count: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        deleteMany: vi.fn(),
      },
      templateTask: {
        deleteMany: vi.fn(),
        createMany: vi.fn(),
      },
      templateSkillRequirement: {
        deleteMany: vi.fn(),
        createMany: vi.fn(),
      },
      skill: {
        count: vi.fn(),
      },
      $transaction: vi.fn(),
    },
  };
});

let prisma: any;
let listWorkTemplates: typeof import("../src/modules/work-templates/workTemplates.service.js").listWorkTemplates;
let getWorkTemplate: typeof import("../src/modules/work-templates/workTemplates.service.js").getWorkTemplate;
let createWorkTemplate: typeof import("../src/modules/work-templates/workTemplates.service.js").createWorkTemplate;
let updateWorkTemplate: typeof import("../src/modules/work-templates/workTemplates.service.js").updateWorkTemplate;
let deleteWorkTemplate: typeof import("../src/modules/work-templates/workTemplates.service.js").deleteWorkTemplate;

const prismaUniqueError = (target: string | string[]) =>
  new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
    code: "P2002",
    clientVersion: "test",
    meta: { target },
  });

describe("workTemplates.service", () => {
  beforeAll(async () => {
    ({ prisma } = await import("../src/infrastructure/db/prisma.js"));
    ({
      listWorkTemplates,
      getWorkTemplate,
      createWorkTemplate,
      updateWorkTemplate,
      deleteWorkTemplate,
    } = await import("../src/modules/work-templates/workTemplates.service.js"));
  });

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.$transaction.mockImplementation(async (cb: any) => cb(prisma));
  });

  test("listWorkTemplates returns items with task counts", async () => {
    prisma.workTemplate.count.mockResolvedValue(1);
    prisma.workTemplate.findMany.mockResolvedValue([
      {
        id: "tpl-1",
        name: "Spring Cleanup",
        description: null,
        isActive: true,
        createdAt: new Date("2025-01-01"),
        updatedAt: new Date("2025-01-02"),
        _count: { tasks: 3 },
      },
    ]);

    const result = await listWorkTemplates("org-1", { page: 1, pageSize: 25 });

    expect(result.items).toEqual([
      {
        id: "tpl-1",
        name: "Spring Cleanup",
        description: null,
        isActive: true,
        taskCount: 3,
        createdAt: new Date("2025-01-01"),
        updatedAt: new Date("2025-01-02"),
      },
    ]);
  });

  test("getWorkTemplate throws when missing", async () => {
    prisma.workTemplate.findFirst.mockResolvedValue(null);

    await expect(getWorkTemplate("org-1", "tpl-1")).rejects.toMatchObject({
      statusCode: 404,
      code: "WORK_TEMPLATE_NOT_FOUND",
    });
  });

  test("createWorkTemplate creates template with tasks", async () => {
    prisma.skill.count.mockResolvedValue(1);
    prisma.workTemplate.create.mockResolvedValue({
      id: "tpl-1",
      name: "Spring Cleanup",
      description: null,
      isActive: true,
      createdAt: new Date("2025-01-01"),
      updatedAt: new Date("2025-01-02"),
      tasks: [{ id: "task-1", title: "Mow", description: null, sortOrder: 0 }],
      skillRequirements: [],
    });

    const result = await createWorkTemplate("org-1", {
      name: "Spring Cleanup",
      tasks: [{ title: "Mow" }],
      skillRequirements: [{ skillId: "skill-1", quantity: 1 }],
    });

    expect(prisma.workTemplate.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          orgId: "org-1",
          name: "Spring Cleanup",
        }),
      }),
    );
    expect(result.template.id).toBe("tpl-1");
  });

  test("createWorkTemplate maps unique name to conflict", async () => {
    prisma.skill.count.mockResolvedValue(0);
    prisma.workTemplate.create.mockRejectedValue(prismaUniqueError(["orgId", "name"]));

    await expect(createWorkTemplate("org-1", { name: "Spring Cleanup" })).rejects.toMatchObject({
      statusCode: 409,
      code: "WORK_TEMPLATE_NAME_TAKEN",
    });
  });

  test("createWorkTemplate rejects missing skills", async () => {
    prisma.skill.count.mockResolvedValue(0);

    await expect(
      createWorkTemplate("org-1", {
        name: "Spring Cleanup",
        skillRequirements: [{ skillId: "skill-missing", quantity: 1 }],
      }),
    ).rejects.toMatchObject({ statusCode: 404, code: "SKILL_NOT_FOUND" });
  });

  test("updateWorkTemplate replaces tasks and requirements", async () => {
    prisma.skill.count.mockResolvedValue(1);
    prisma.workTemplate.findFirst.mockResolvedValue({ id: "tpl-1" });
    prisma.workTemplate.update.mockResolvedValue({
      id: "tpl-1",
      name: "Updated",
      description: null,
      isActive: true,
      createdAt: new Date("2025-01-01"),
      updatedAt: new Date("2025-01-02"),
      tasks: [],
      skillRequirements: [],
    });

    const result = await updateWorkTemplate("org-1", "tpl-1", {
      name: "Updated",
      tasks: [{ title: "Edge" }],
      skillRequirements: [{ skillId: "skill-1", quantity: 1 }],
    });

    expect(prisma.templateTask.deleteMany).toHaveBeenCalledWith({
      where: { templateId: "tpl-1", orgId: "org-1" },
    });
    expect(prisma.templateSkillRequirement.deleteMany).toHaveBeenCalledWith({
      where: { templateId: "tpl-1", orgId: "org-1" },
    });
    expect(result.template.name).toBe("Updated");
  });

  test("deleteWorkTemplate deletes when found", async () => {
    prisma.workTemplate.deleteMany.mockResolvedValue({ count: 1 });

    const result = await deleteWorkTemplate("org-1", "tpl-1");

    expect(result).toEqual({ deleted: true });
  });
});
