import { beforeAll, beforeEach, describe, expect, test, vi, type MockedFunction } from "vitest";
import { TaskStatus } from "@prisma/client";
import type { Request, Response } from "express";

vi.mock("../src/modules/work-orders/workOrders.service.js", () => ({
  addWorkOrderIncident: vi.fn(),
  instantiateWorkOrderTasks: vi.fn(),
  updateWorkOrderTaskStatus: vi.fn(),
}));

let addWorkOrderIncidentHandler: typeof import("../src/modules/work-orders/workOrders.controller.js").addWorkOrderIncidentHandler;
let instantiateWorkOrderTasksHandler: typeof import("../src/modules/work-orders/workOrders.controller.js").instantiateWorkOrderTasksHandler;
let updateWorkOrderTaskStatusHandler: typeof import("../src/modules/work-orders/workOrders.controller.js").updateWorkOrderTaskStatusHandler;

type WorkOrdersService = typeof import("../src/modules/work-orders/workOrders.service.js");
let addWorkOrderIncident: MockedFunction<WorkOrdersService["addWorkOrderIncident"]>;
let instantiateWorkOrderTasks: MockedFunction<WorkOrdersService["instantiateWorkOrderTasks"]>;
let updateWorkOrderTaskStatus: MockedFunction<WorkOrdersService["updateWorkOrderTaskStatus"]>;

describe("workOrders.tasks.controller", () => {
  beforeAll(async () => {
    ({
      addWorkOrderIncidentHandler,
      instantiateWorkOrderTasksHandler,
      updateWorkOrderTaskStatusHandler,
    } = await import("../src/modules/work-orders/workOrders.controller.js"));

    const service = await import("../src/modules/work-orders/workOrders.service.js");
    addWorkOrderIncident = vi.mocked(service.addWorkOrderIncident);
    instantiateWorkOrderTasks = vi.mocked(service.instantiateWorkOrderTasks);
    updateWorkOrderTaskStatus = vi.mocked(service.updateWorkOrderTaskStatus);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRes = () =>
    ({
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    }) as unknown as Response;

  test("addWorkOrderIncidentHandler returns 201", async () => {
    addWorkOrderIncident.mockResolvedValue({ incident: { id: "inc-1" } as any });

    const req = {
      params: { id: "wo-1" },
      body: { title: "Leak" },
      org: { id: "org-1", membershipId: "mem-1" },
    } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await addWorkOrderIncidentHandler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ incident: { id: "inc-1" } });
  });

  test("instantiateWorkOrderTasksHandler returns 201", async () => {
    instantiateWorkOrderTasks.mockResolvedValue({ tasks: [] });

    const req = {
      params: { id: "wo-1", incidentId: "inc-1" },
      body: {},
      org: { id: "org-1", membershipId: "mem-1" },
    } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await instantiateWorkOrderTasksHandler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ tasks: [] });
  });

  test("updateWorkOrderTaskStatusHandler returns 200", async () => {
    updateWorkOrderTaskStatus.mockResolvedValue({
      task: {
        id: "task-1",
        incidentId: "inc-1",
        title: "Edge beds",
        description: null,
        status: TaskStatus.DONE,
        sortOrder: 0,
        completedAt: null,
        createdAt: new Date("2025-01-02"),
        updatedAt: new Date("2025-01-02"),
      },
      readiness: { total: 1, done: 1, skipped: 0, pending: 0, isReady: true },
    });

    const req = {
      params: { id: "wo-1", taskId: "task-1" },
      body: { status: "DONE" },
      org: { id: "org-1", membershipId: "mem-1" },
    } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await updateWorkOrderTaskStatusHandler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      task: {
        id: "task-1",
        incidentId: "inc-1",
        title: "Edge beds",
        description: null,
        status: TaskStatus.DONE,
        sortOrder: 0,
        completedAt: null,
        createdAt: new Date("2025-01-02"),
        updatedAt: new Date("2025-01-02"),
      },
      readiness: { total: 1, done: 1, skipped: 0, pending: 0, isReady: true },
    });
  });

  test("addWorkOrderIncidentHandler rejects missing org", async () => {
    const req = { params: { id: "wo-1" }, body: { title: "Leak" } } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await addWorkOrderIncidentHandler(req, res, next);

    const err = next.mock.calls[0]?.[0];
    expect(err).toMatchObject({ statusCode: 400, code: "ORG_REQUIRED" });
  });
});
