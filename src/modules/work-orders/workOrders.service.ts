import { WorkOrderStatus, type Prisma, type WorkOrderPriority } from "@prisma/client";

import { prisma } from "../../infrastructure/db/prisma.js";
import { AppError } from "../../shared/errors.js";

import type { WorkOrdersListQuery } from "./dto/workOrders.dto.js";

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
    throw new AppError("Work order not found", 404, { code: "WORK_ORDER_NOT_FOUND" });
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
