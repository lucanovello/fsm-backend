import { Prisma } from "@prisma/client";

import { prisma } from "../../infrastructure/db/prisma.js";
import { AppError } from "../../shared/errors.js";

import type { CustomersListQuery } from "./dto/customers.dto.js";

const DEFAULT_RECENT_WORK_ORDERS = 10;

type CustomerSummary = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
};

type CustomerDetails = {
  customer: CustomerSummary;
  locations: Array<{
    id: string;
    label: string | null;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    province: string | null;
    postalCode: string | null;
    country: string | null;
    latitude: number | null;
    longitude: number | null;
  }>;
  recentWorkOrders: Array<{
    id: string;
    summary: string;
    status: string;
    priority: string;
    scheduledStart: Date | null;
    scheduledEnd: Date | null;
    location: {
      id: string;
      label: string | null;
      city: string;
    };
    assignedTechnician: {
      id: string;
      displayName: string;
    } | null;
  }>;
};

export async function listCustomers(query: CustomersListQuery) {
  const { q, page, pageSize } = query;

  const where: Prisma.CustomerWhereInput | undefined = q
    ? {
        OR: [
          { name: { contains: q, mode: Prisma.QueryMode.insensitive } },
          { email: { contains: q, mode: Prisma.QueryMode.insensitive } },
          { phone: { contains: q, mode: Prisma.QueryMode.insensitive } },
        ],
      }
    : undefined;

  const skip = (page - 1) * pageSize;
  const [total, items] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, phone: true },
    }),
  ]);

  return { items, page, pageSize, total };
}

export async function getCustomerDetails(id: string): Promise<CustomerDetails> {
  const customer = await prisma.customer.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, phone: true },
  });

  if (!customer) {
    throw new AppError("Customer not found", 404, { code: "CUSTOMER_NOT_FOUND" });
  }

  const [locations, workOrders] = await Promise.all([
    prisma.serviceLocation.findMany({
      where: { customerId: id },
      orderBy: [{ label: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        label: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        province: true,
        postalCode: true,
        country: true,
        latitude: true,
        longitude: true,
      },
    }),
    prisma.workOrder.findMany({
      where: { customerId: id },
      take: DEFAULT_RECENT_WORK_ORDERS,
      orderBy: { scheduledStart: "desc" },
      select: {
        id: true,
        summary: true,
        status: true,
        priority: true,
        scheduledStart: true,
        scheduledEnd: true,
        serviceLocation: { select: { id: true, label: true, city: true } },
        assignedTechnician: { select: { id: true, displayName: true } },
      },
    }),
  ]);

  const recentWorkOrders = workOrders.map((wo) => ({
    id: wo.id,
    summary: wo.summary,
    status: wo.status,
    priority: wo.priority,
    scheduledStart: wo.scheduledStart,
    scheduledEnd: wo.scheduledEnd,
    location: {
      id: wo.serviceLocation.id,
      label: wo.serviceLocation.label,
      city: wo.serviceLocation.city,
    },
    assignedTechnician: wo.assignedTechnician
      ? { id: wo.assignedTechnician.id, displayName: wo.assignedTechnician.displayName }
      : null,
  }));

  return { customer, locations, recentWorkOrders };
}
