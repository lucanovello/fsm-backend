import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { TaskStatus } from "@prisma/client";

vi.mock("../src/infrastructure/db/prisma.js", () => {
  return {
    prisma: {
      workOrder: {
        findFirst: vi.fn(),
      },
      workOrderIncident: {
        findFirst: vi.fn(),
        create: vi.fn(),
      },
      workOrderTask: {
        count: vi.fn(),
        createMany: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        findFirst: vi.fn(),
      },
      workTemplate: {
        findFirst: vi.fn(),
      },
    },
  };
});

let prisma: any;
let addWorkOrderIncident: typeof import("../src/modules/work-orders/workOrders.service.js").addWorkOrderIncident;
let instantiateWorkOrderTasks: typeof import("../src/modules/work-orders/workOrders.service.js").instantiateWorkOrderTasks;
let updateWorkOrderTaskStatus: typeof import("../src/modules/work-orders/workOrders.service.js").updateWorkOrderTaskStatus;
let computeCompletionReadiness: typeof import("../src/modules/work-orders/workOrders.service.js").computeCompletionReadiness;

describe("workOrders.tasks.service", () => {
  beforeAll(async () => {
    ({ prisma } = await import("../src/infrastructure/db/prisma.js"));
    ({
      addWorkOrderIncident,
      instantiateWorkOrderTasks,
      updateWorkOrderTaskStatus,
      computeCompletionReadiness,
    } = await import("../src/modules/work-orders/workOrders.service.js"));
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("instantiateWorkOrderTasks creates tasks from template", async () => {
    prisma.workOrder.findFirst.mockResolvedValue({ id: "wo-1" });
    prisma.workOrderIncident.findFirst.mockResolvedValue({ id: "inc-1", templateId: "tpl-1" });
    prisma.workOrderTask.count.mockResolvedValue(0);
    prisma.workTemplate.findFirst.mockResolvedValue({
      id: "tpl-1",
      tasks: [{ title: "Mow lawn", description: null, sortOrder: 0 }],
    });
    prisma.workOrderTask.createMany.mockResolvedValue({ count: 1 });
    prisma.workOrderTask.findMany.mockResolvedValue([
      {
        id: "task-1",
        incidentId: "inc-1",
        title: "Mow lawn",
        description: null,
        status: TaskStatus.TODO,
        sortOrder: 0,
        completedAt: null,
        createdAt: new Date("2025-01-01"),
        updatedAt: new Date("2025-01-01"),
      },
    ]);

    const result = await instantiateWorkOrderTasks("org-1", "wo-1", "inc-1", {});

    expect(prisma.workOrderTask.createMany).toHaveBeenCalledWith({
      data: [
        {
          orgId: "org-1",
          incidentId: "inc-1",
          title: "Mow lawn",
          description: null,
          status: TaskStatus.TODO,
          sortOrder: 0,
        },
      ],
    });
    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0]?.title).toBe("Mow lawn");
  });

  test("addWorkOrderIncident uses template defaults", async () => {
    prisma.workOrder.findFirst.mockResolvedValue({ id: "wo-1" });
    prisma.workTemplate.findFirst.mockResolvedValue({
      id: "tpl-1",
      name: "Irrigation Check",
      description: "Inspect sprinkler heads",
    });
    prisma.workOrderIncident.findFirst.mockResolvedValue({ sortOrder: 1 });
    prisma.workOrderIncident.create.mockResolvedValue({
      id: "inc-1",
      workOrderId: "wo-1",
      templateId: "tpl-1",
      title: "Irrigation Check",
      description: "Inspect sprinkler heads",
      sortOrder: 2,
      createdAt: new Date("2025-01-01"),
      updatedAt: new Date("2025-01-01"),
    });

    const result = await addWorkOrderIncident("org-1", "wo-1", { templateId: "tpl-1" });

    expect(result.incident.title).toBe("Irrigation Check");
    expect(result.incident.sortOrder).toBe(2);
  });

  test("instantiateWorkOrderTasks throws when already instantiated", async () => {
    prisma.workOrder.findFirst.mockResolvedValue({ id: "wo-1" });
    prisma.workOrderIncident.findFirst.mockResolvedValue({ id: "inc-1", templateId: "tpl-1" });
    prisma.workOrderTask.count.mockResolvedValue(2);

    await expect(instantiateWorkOrderTasks("org-1", "wo-1", "inc-1", {})).rejects.toMatchObject({
      statusCode: 409,
      code: "TASKS_ALREADY_INSTANTIATED",
    });
  });

  test("updateWorkOrderTaskStatus updates status and returns readiness", async () => {
    prisma.workOrder.findFirst.mockResolvedValue({ id: "wo-1" });
    prisma.workOrderTask.findFirst.mockResolvedValue({ id: "task-1", status: TaskStatus.TODO });
    prisma.workOrderTask.update.mockResolvedValue({
      id: "task-1",
      incidentId: "inc-1",
      title: "Edge beds",
      description: null,
      status: TaskStatus.DONE,
      sortOrder: 0,
      completedAt: new Date("2025-01-02"),
      createdAt: new Date("2025-01-01"),
      updatedAt: new Date("2025-01-02"),
    });
    prisma.workOrderTask.findMany.mockResolvedValue([
      { status: TaskStatus.DONE },
      { status: TaskStatus.SKIPPED },
    ]);

    const result = await updateWorkOrderTaskStatus("org-1", "wo-1", "task-1", {
      status: TaskStatus.DONE,
    });

    expect(prisma.workOrderTask.update).toHaveBeenCalledWith({
      where: { id: "task-1" },
      data: { status: TaskStatus.DONE, completedAt: expect.any(Date) },
      select: expect.any(Object),
    });
    expect(result.task.status).toBe(TaskStatus.DONE);
    expect(result.readiness).toEqual({
      total: 2,
      done: 1,
      skipped: 1,
      pending: 0,
      isReady: true,
    });
  });

  test("computeCompletionReadiness handles pending tasks", () => {
    const readiness = computeCompletionReadiness([
      { status: TaskStatus.TODO },
      { status: TaskStatus.DONE },
      { status: TaskStatus.SKIPPED },
    ]);

    expect(readiness).toEqual({
      total: 3,
      done: 1,
      skipped: 1,
      pending: 1,
      isReady: false,
    });
  });

  test("computeCompletionReadiness handles empty task list", () => {
    const readiness = computeCompletionReadiness([]);

    expect(readiness).toEqual({
      total: 0,
      done: 0,
      skipped: 0,
      pending: 0,
      isReady: false,
    });
  });
});
