import { TaskStatus, WorkOrderStatus, type Prisma, type WorkOrderPriority } from "@prisma/client";

import { prisma } from "../../infrastructure/db/prisma.js";
import { AppError } from "../../shared/errors.js";

import type {
  WorkOrderIncidentCreateInput,
  WorkOrderTaskInstantiateInput,
  WorkOrderTaskStatusUpdateInput,
  WorkOrdersListQuery,
} from "./dto/workOrders.dto.js";

type DateRange = { gte: Date; lt: Date };

type WorkOrderListItem = {
  id: string;
  summary: string;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  scheduledStart: Date | null;
  scheduledEnd: Date | null;
  customer: { id: string; name: string };
  location: { id: string; label: string | null; city: string };
  assignedTechnician: { id: string; displayName: string } | null;
};

type WorkOrderDetail = {
  id: string;
  summary: string;
  description: string | null;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  scheduledStart: Date | null;
  scheduledEnd: Date | null;
  actualStart: Date | null;
  actualEnd: Date | null;
  customer: { id: string; name: string };
  location: {
    id: string;
    label: string | null;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    province: string | null;
    postalCode: string | null;
    country: string | null;
  };
  assignedTechnician: { id: string; displayName: string } | null;
  notes: Array<{
    id: string;
    author: { id: string; email: string };
    body: string;
    createdAt: Date;
  }>;
  lineItems: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPriceCents: number;
  }>;
};

type CompletionReadiness = {
  total: number;
  done: number;
  skipped: number;
  pending: number;
  isReady: boolean;
};

const workOrderNotFound = () =>
  new AppError("Work order not found", 404, { code: "WORK_ORDER_NOT_FOUND" });

const templateNotFound = () =>
  new AppError("Work template not found", 404, { code: "WORK_TEMPLATE_NOT_FOUND" });

const incidentNotFound = () =>
  new AppError("Work order incident not found", 404, { code: "WORK_ORDER_INCIDENT_NOT_FOUND" });

const incidentTitleRequired = () =>
  new AppError("Incident title required", 400, { code: "INCIDENT_TITLE_REQUIRED" });

const tasksAlreadyInstantiated = () =>
  new AppError("Tasks already instantiated", 409, { code: "TASKS_ALREADY_INSTANTIATED" });

const taskNotFound = () =>
  new AppError("Work order task not found", 404, { code: "WORK_ORDER_TASK_NOT_FOUND" });

function parseStatuses(status?: string): WorkOrderStatus[] | undefined {
  if (!status) return undefined;
  const parts = status
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return undefined;

  const allowed = new Set(Object.values(WorkOrderStatus));
  const invalid = parts.filter((p) => !allowed.has(p as WorkOrderStatus));
  if (invalid.length > 0) {
    throw new AppError("Invalid status", 400, { code: "INVALID_STATUS" });
  }

  // Deduplicate while preserving order
  const seen = new Set<string>();
  const unique = parts.filter((p) => {
    const key = p.toUpperCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }) as WorkOrderStatus[];

  return unique;
}

function buildDateRange(date?: string): DateRange | undefined {
  if (!date) return undefined;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    throw new AppError("Invalid date", 400, { code: "INVALID_DATE" });
  }

  const start = new Date(
    Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()),
  );
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { gte: start, lt: end };
}

export async function listWorkOrders(query: WorkOrdersListQuery) {
  const { technicianId, page, pageSize } = query;
  const statuses = parseStatuses(query.status);
  const dateRange = buildDateRange(query.date);

  const where: Prisma.WorkOrderWhereInput = {};

  if (statuses && statuses.length > 0) {
    where.status = { in: statuses };
  }

  if (technicianId) {
    where.assignedTechnicianId = technicianId;
  }

  if (dateRange) {
    where.scheduledStart = dateRange;
  }

  const skip = (page - 1) * pageSize;

  const [total, results] = await Promise.all([
    prisma.workOrder.count({ where }),
    prisma.workOrder.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { scheduledStart: "asc" },
      select: {
        id: true,
        summary: true,
        status: true,
        priority: true,
        scheduledStart: true,
        scheduledEnd: true,
        customer: { select: { id: true, name: true } },
        serviceLocation: { select: { id: true, label: true, city: true } },
        assignedTechnician: { select: { id: true, displayName: true } },
      },
    }),
  ]);

  const items: WorkOrderListItem[] = results.map((wo) => ({
    id: wo.id,
    summary: wo.summary,
    status: wo.status,
    priority: wo.priority,
    scheduledStart: wo.scheduledStart,
    scheduledEnd: wo.scheduledEnd,
    customer: wo.customer,
    location: {
      id: wo.serviceLocation.id,
      label: wo.serviceLocation.label,
      city: wo.serviceLocation.city,
    },
    assignedTechnician: wo.assignedTechnician
      ? { id: wo.assignedTechnician.id, displayName: wo.assignedTechnician.displayName }
      : null,
  }));

  return { items, page, pageSize, total };
}

export async function getWorkOrderDetail(id: string): Promise<WorkOrderDetail> {
  const wo = await prisma.workOrder.findUnique({
    where: { id },
    select: {
      id: true,
      summary: true,
      description: true,
      status: true,
      priority: true,
      scheduledStart: true,
      scheduledEnd: true,
      actualStart: true,
      actualEnd: true,
      customer: { select: { id: true, name: true } },
      serviceLocation: {
        select: {
          id: true,
          label: true,
          addressLine1: true,
          addressLine2: true,
          city: true,
          province: true,
          postalCode: true,
          country: true,
        },
      },
      assignedTechnician: { select: { id: true, displayName: true } },
      notes: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          body: true,
          createdAt: true,
          author: { select: { id: true, email: true } },
        },
      },
      lineItems: {
        orderBy: { createdAt: "asc" },
        select: { id: true, description: true, quantity: true, unitPriceCents: true },
      },
    },
  });

  if (!wo) {
    throw workOrderNotFound();
  }

  return {
    id: wo.id,
    summary: wo.summary,
    description: wo.description ?? null,
    status: wo.status,
    priority: wo.priority,
    scheduledStart: wo.scheduledStart,
    scheduledEnd: wo.scheduledEnd,
    actualStart: wo.actualStart,
    actualEnd: wo.actualEnd,
    customer: wo.customer,
    location: {
      id: wo.serviceLocation.id,
      label: wo.serviceLocation.label,
      addressLine1: wo.serviceLocation.addressLine1,
      addressLine2: wo.serviceLocation.addressLine2,
      city: wo.serviceLocation.city,
      province: wo.serviceLocation.province,
      postalCode: wo.serviceLocation.postalCode,
      country: wo.serviceLocation.country,
    },
    assignedTechnician: wo.assignedTechnician
      ? { id: wo.assignedTechnician.id, displayName: wo.assignedTechnician.displayName }
      : null,
    notes: wo.notes.map((note) => ({
      id: note.id,
      author: note.author,
      body: note.body,
      createdAt: note.createdAt,
    })),
    lineItems: wo.lineItems,
  };
}

const ensureWorkOrder = async (orgId: string, workOrderId: string) => {
  const workOrder = await prisma.workOrder.findFirst({
    where: { id: workOrderId, orgId },
    select: { id: true },
  });

  if (!workOrder) {
    throw workOrderNotFound();
  }

  return workOrder;
};

const ensureTemplate = async (orgId: string, templateId: string) => {
  const template = await prisma.workTemplate.findFirst({
    where: { id: templateId, orgId },
    select: { id: true, name: true, description: true },
  });

  if (!template) {
    throw templateNotFound();
  }

  return template;
};

const ensureIncident = async (orgId: string, workOrderId: string, incidentId: string) => {
  const incident = await prisma.workOrderIncident.findFirst({
    where: { id: incidentId, workOrderId, orgId },
    select: { id: true, templateId: true },
  });

  if (!incident) {
    throw incidentNotFound();
  }

  return incident;
};

export function computeCompletionReadiness(
  tasks: Array<{ status: TaskStatus }>,
): CompletionReadiness {
  const total = tasks.length;
  const done = tasks.filter((task) => task.status === TaskStatus.DONE).length;
  const skipped = tasks.filter((task) => task.status === TaskStatus.SKIPPED).length;
  const pending = total - done - skipped;
  const isReady = total > 0 && pending === 0;

  return { total, done, skipped, pending, isReady };
}

export async function addWorkOrderIncident(
  orgId: string,
  workOrderId: string,
  input: WorkOrderIncidentCreateInput,
) {
  await ensureWorkOrder(orgId, workOrderId);

  const template = input.templateId ? await ensureTemplate(orgId, input.templateId) : null;
  const title = input.title ?? template?.name;
  const description = input.description ?? template?.description ?? null;

  if (!title) {
    throw incidentTitleRequired();
  }

  let sortOrder = input.sortOrder;
  if (sortOrder === undefined) {
    const last = await prisma.workOrderIncident.findFirst({
      where: { orgId, workOrderId },
      orderBy: [{ sortOrder: "desc" }, { createdAt: "desc" }],
      select: { sortOrder: true },
    });
    sortOrder = (last?.sortOrder ?? -1) + 1;
  }

  const incident = await prisma.workOrderIncident.create({
    data: {
      orgId,
      workOrderId,
      templateId: template?.id ?? null,
      title,
      description,
      sortOrder,
    },
    select: {
      id: true,
      workOrderId: true,
      templateId: true,
      title: true,
      description: true,
      sortOrder: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return { incident };
}

export async function instantiateWorkOrderTasks(
  orgId: string,
  workOrderId: string,
  incidentId: string,
  input: WorkOrderTaskInstantiateInput,
) {
  await ensureWorkOrder(orgId, workOrderId);
  const incident = await ensureIncident(orgId, workOrderId, incidentId);

  const templateId = input.templateId ?? incident.templateId;
  if (!templateId) {
    throw templateNotFound();
  }

  const existingCount = await prisma.workOrderTask.count({
    where: { orgId, incidentId },
  });

  if (existingCount > 0) {
    throw tasksAlreadyInstantiated();
  }

  const template = await prisma.workTemplate.findFirst({
    where: { id: templateId, orgId },
    select: {
      id: true,
      tasks: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: { title: true, description: true, sortOrder: true },
      },
    },
  });

  if (!template) {
    throw templateNotFound();
  }

  if (template.tasks.length > 0) {
    await prisma.workOrderTask.createMany({
      data: template.tasks.map((task) => ({
        orgId,
        incidentId,
        title: task.title,
        description: task.description ?? null,
        status: TaskStatus.TODO,
        sortOrder: task.sortOrder,
      })),
    });
  }

  const tasks = await prisma.workOrderTask.findMany({
    where: { orgId, incidentId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      incidentId: true,
      title: true,
      description: true,
      status: true,
      sortOrder: true,
      completedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return { tasks };
}

export async function updateWorkOrderTaskStatus(
  orgId: string,
  workOrderId: string,
  taskId: string,
  input: WorkOrderTaskStatusUpdateInput,
) {
  await ensureWorkOrder(orgId, workOrderId);

  const task = await prisma.workOrderTask.findFirst({
    where: { id: taskId, orgId, incident: { workOrderId } },
    select: { id: true, status: true },
  });

  if (!task) {
    throw taskNotFound();
  }

  const completedAt = input.status === TaskStatus.DONE ? new Date() : null;

  const updated = await prisma.workOrderTask.update({
    where: { id: task.id },
    data: { status: input.status, completedAt },
    select: {
      id: true,
      incidentId: true,
      title: true,
      description: true,
      status: true,
      sortOrder: true,
      completedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const readiness = await getWorkOrderCompletionReadiness(orgId, workOrderId);

  return { task: updated, readiness };
}

export async function getWorkOrderCompletionReadiness(orgId: string, workOrderId: string) {
  const tasks = await prisma.workOrderTask.findMany({
    where: { orgId, incident: { workOrderId } },
    select: { status: true },
  });

  return computeCompletionReadiness(tasks);
}
