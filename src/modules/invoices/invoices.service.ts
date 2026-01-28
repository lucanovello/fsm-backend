import { InvoiceStatus, Prisma } from "@prisma/client";

import { prisma } from "../../infrastructure/db/prisma.js";
import { AppError } from "../../shared/errors.js";

import type {
  InvoiceCreateInput,
  InvoiceLineInput,
  InvoiceLineUpdateInput,
  InvoiceStatusUpdateInput,
  InvoiceWorkOrdersAddInput,
} from "./dto/invoices.dto.js";

type InvoiceLineDetail = {
  id: string;
  description: string;
  quantity: number;
  unitPriceCents: number | null;
};

type InvoiceWorkOrderDetail = {
  id: string;
  workOrder: { id: string; summary: string };
};

type InvoiceDetail = {
  id: string;
  status: InvoiceStatus;
  customer: { id: string; name: string };
  dueDate: Date | null;
  memo: string | null;
  issuedAt: Date | null;
  paidAt: Date | null;
  voidedAt: Date | null;
  workOrders: InvoiceWorkOrderDetail[];
  lines: InvoiceLineDetail[];
  createdAt: Date;
  updatedAt: Date;
};

const invoiceNotFound = () => new AppError("Invoice not found", 404, { code: "INVOICE_NOT_FOUND" });

const invoiceNotDraft = () =>
  new AppError("Invoice must be in draft", 409, { code: "INVOICE_NOT_DRAFT" });

const customerNotFound = () =>
  new AppError("Customer not found", 404, { code: "CUSTOMER_NOT_FOUND" });

const workOrderNotFound = () =>
  new AppError("Work order not found", 404, { code: "WORK_ORDER_NOT_FOUND" });

const workOrderCustomerMismatch = () =>
  new AppError("Work order belongs to different customer", 400, {
    code: "INVOICE_WORK_ORDER_CUSTOMER_MISMATCH",
  });

const invoiceLineNotFound = () =>
  new AppError("Invoice line not found", 404, { code: "INVOICE_LINE_NOT_FOUND" });

const invoiceWorkOrderNotFound = () =>
  new AppError("Invoice work order not found", 404, { code: "INVOICE_WORK_ORDER_NOT_FOUND" });

const invalidTransition = () =>
  new AppError("Invalid invoice status transition", 409, {
    code: "INVOICE_STATUS_INVALID_TRANSITION",
  });

const ensureCustomer = async (orgId: string, customerId: string) => {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, orgId },
    select: { id: true },
  });

  if (!customer) {
    throw customerNotFound();
  }

  return customer;
};

const ensureInvoice = async (orgId: string, invoiceId: string) => {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, orgId },
    select: { id: true, status: true, customerId: true },
  });

  if (!invoice) {
    throw invoiceNotFound();
  }

  return invoice;
};

const ensureDraft = (status: InvoiceStatus) => {
  if (status !== InvoiceStatus.DRAFT) {
    throw invoiceNotDraft();
  }
};

const ensureWorkOrdersForCustomer = async (
  orgId: string,
  customerId: string,
  workOrderIds: string[],
) => {
  const uniqueIds = Array.from(new Set(workOrderIds));
  if (uniqueIds.length === 0) {
    return [];
  }

  const workOrders = await prisma.workOrder.findMany({
    where: { id: { in: uniqueIds }, orgId },
    select: { id: true, customerId: true },
  });

  if (workOrders.length !== uniqueIds.length) {
    throw workOrderNotFound();
  }

  const invalid = workOrders.find((wo) => wo.customerId !== customerId);
  if (invalid) {
    throw workOrderCustomerMismatch();
  }

  return workOrders;
};

const mapLineInput = (orgId: string, input: InvoiceLineInput) => ({
  orgId,
  description: input.description,
  quantity: input.quantity ?? 1,
  unitPriceCents: input.unitPriceCents ?? null,
});

const invoiceSelect = {
  id: true,
  status: true,
  dueDate: true,
  memo: true,
  issuedAt: true,
  paidAt: true,
  voidedAt: true,
  createdAt: true,
  updatedAt: true,
  customer: { select: { id: true, name: true } },
  workOrders: {
    orderBy: { createdAt: "asc" as const },
    select: {
      id: true,
      workOrder: { select: { id: true, summary: true } },
    },
  },
  lines: {
    orderBy: { createdAt: "asc" as const },
    select: { id: true, description: true, quantity: true, unitPriceCents: true },
  },
};

const shapeInvoice = (invoice: any): InvoiceDetail => ({
  id: invoice.id,
  status: invoice.status,
  customer: invoice.customer,
  dueDate: invoice.dueDate,
  memo: invoice.memo,
  issuedAt: invoice.issuedAt,
  paidAt: invoice.paidAt,
  voidedAt: invoice.voidedAt,
  workOrders: invoice.workOrders,
  lines: invoice.lines,
  createdAt: invoice.createdAt,
  updatedAt: invoice.updatedAt,
});

export async function getInvoice(orgId: string, id: string) {
  const invoice = await prisma.invoice.findFirst({
    where: { id, orgId },
    select: invoiceSelect,
  });

  if (!invoice) {
    throw invoiceNotFound();
  }

  return { invoice: shapeInvoice(invoice) };
}

export async function createInvoice(orgId: string, input: InvoiceCreateInput) {
  await ensureCustomer(orgId, input.customerId);
  const workOrderIds = input.workOrderIds ?? [];
  await ensureWorkOrdersForCustomer(orgId, input.customerId, workOrderIds);

  const lines = input.lines?.map((line) => mapLineInput(orgId, line));
  const workOrders = workOrderIds.map((workOrderId) => ({ orgId, workOrderId }));

  const invoice = await prisma.invoice.create({
    data: {
      orgId,
      customerId: input.customerId,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      memo: input.memo ?? null,
      lines: lines && lines.length > 0 ? { create: lines } : undefined,
      workOrders: workOrders.length > 0 ? { create: workOrders } : undefined,
    },
    select: invoiceSelect,
  });

  return { invoice: shapeInvoice(invoice) };
}

export async function addInvoiceWorkOrders(
  orgId: string,
  invoiceId: string,
  input: InvoiceWorkOrdersAddInput,
) {
  const invoice = await ensureInvoice(orgId, invoiceId);
  ensureDraft(invoice.status);

  await ensureWorkOrdersForCustomer(orgId, invoice.customerId, input.workOrderIds);

  const data = input.workOrderIds.map((workOrderId) => ({
    orgId,
    invoiceId,
    workOrderId,
  }));

  await prisma.invoiceWorkOrder.createMany({ data, skipDuplicates: true });

  return getInvoice(orgId, invoiceId);
}

export async function removeInvoiceWorkOrder(
  orgId: string,
  invoiceId: string,
  workOrderId: string,
) {
  const invoice = await ensureInvoice(orgId, invoiceId);
  ensureDraft(invoice.status);

  const result = await prisma.invoiceWorkOrder.deleteMany({
    where: { orgId, invoiceId, workOrderId },
  });

  if (result.count === 0) {
    throw invoiceWorkOrderNotFound();
  }

  return getInvoice(orgId, invoiceId);
}

export async function createInvoiceLine(orgId: string, invoiceId: string, input: InvoiceLineInput) {
  const invoice = await ensureInvoice(orgId, invoiceId);
  ensureDraft(invoice.status);

  const line = await prisma.invoiceLine.create({
    data: {
      orgId,
      invoiceId,
      description: input.description,
      quantity: input.quantity ?? 1,
      unitPriceCents: input.unitPriceCents ?? null,
    },
    select: { id: true, description: true, quantity: true, unitPriceCents: true },
  });

  return { line };
}

export async function updateInvoiceLine(
  orgId: string,
  invoiceId: string,
  lineId: string,
  input: InvoiceLineUpdateInput,
) {
  const invoice = await ensureInvoice(orgId, invoiceId);
  ensureDraft(invoice.status);

  const existing = await prisma.invoiceLine.findFirst({
    where: { id: lineId, invoiceId, orgId },
    select: { id: true },
  });

  if (!existing) {
    throw invoiceLineNotFound();
  }

  try {
    const line = await prisma.invoiceLine.update({
      where: { id: lineId },
      data: {
        description: input.description,
        quantity: input.quantity,
        unitPriceCents: input.unitPriceCents,
      },
      select: { id: true, description: true, quantity: true, unitPriceCents: true },
    });

    return { line };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      throw invoiceLineNotFound();
    }
    throw err;
  }
}

export async function deleteInvoiceLine(orgId: string, invoiceId: string, lineId: string) {
  const invoice = await ensureInvoice(orgId, invoiceId);
  ensureDraft(invoice.status);

  const result = await prisma.invoiceLine.deleteMany({
    where: { id: lineId, invoiceId, orgId },
  });

  if (result.count === 0) {
    throw invoiceLineNotFound();
  }

  return { deleted: true };
}

const transitionMap: Record<InvoiceStatus, InvoiceStatus[]> = {
  [InvoiceStatus.DRAFT]: [InvoiceStatus.ISSUED, InvoiceStatus.VOID],
  [InvoiceStatus.ISSUED]: [InvoiceStatus.PAID, InvoiceStatus.VOID],
  [InvoiceStatus.PAID]: [],
  [InvoiceStatus.VOID]: [],
};

export async function updateInvoiceStatus(
  orgId: string,
  invoiceId: string,
  input: InvoiceStatusUpdateInput,
) {
  const invoice = await ensureInvoice(orgId, invoiceId);

  const allowed = transitionMap[invoice.status] ?? [];
  if (!allowed.includes(input.status)) {
    throw invalidTransition();
  }

  const now = new Date();
  const data: Prisma.InvoiceUpdateInput = { status: input.status };
  if (input.status === InvoiceStatus.ISSUED) {
    data.issuedAt = now;
  }
  if (input.status === InvoiceStatus.PAID) {
    data.paidAt = now;
  }
  if (input.status === InvoiceStatus.VOID) {
    data.voidedAt = now;
  }

  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data,
    select: invoiceSelect,
  });

  return { invoice: shapeInvoice(updated) };
}
