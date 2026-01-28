import { Prisma } from "@prisma/client";

import { prisma } from "../../infrastructure/db/prisma.js";
import { AppError } from "../../shared/errors.js";

import { buildRecurrenceRule, generateNextOccurrences } from "./recurrence.service.js";

import type {
  ContractItemInput,
  RecurrenceRuleInput,
  ServiceContractCreateInput,
  ServiceContractMaterializeInput,
  ServiceContractsListQuery,
  ServiceContractUpdateInput,
} from "./dto/serviceContracts.dto.js";

const contractNotFound = () =>
  new AppError("Service contract not found", 404, { code: "SERVICE_CONTRACT_NOT_FOUND" });

const customerNotFound = () =>
  new AppError("Customer not found", 404, { code: "CUSTOMER_NOT_FOUND" });

const serviceLocationNotFound = () =>
  new AppError("Service location not found", 404, { code: "SERVICE_LOCATION_NOT_FOUND" });

const workTemplateNotFound = () =>
  new AppError("Work template not found", 404, { code: "WORK_TEMPLATE_NOT_FOUND" });

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

const ensureServiceLocation = async (orgId: string, customerId: string, locationId: string) => {
  const location = await prisma.serviceLocation.findFirst({
    where: { id: locationId, orgId, customerId },
    select: { id: true },
  });

  if (!location) {
    throw serviceLocationNotFound();
  }

  return location;
};

const ensureWorkTemplates = async (orgId: string, items?: ContractItemInput[]) => {
  const templateIds = items
    ?.map((item) => item.workTemplateId)
    .filter((id): id is string => typeof id === "string" && id.length > 0);

  if (!templateIds || templateIds.length === 0) {
    return;
  }

  const uniqueIds = Array.from(new Set(templateIds));
  const count = await prisma.workTemplate.count({
    where: { orgId, id: { in: uniqueIds } },
  });

  if (count !== uniqueIds.length) {
    throw workTemplateNotFound();
  }
};

const mapRecurrenceInput = (input: RecurrenceRuleInput) => ({
  rrule: input.rrule,
  dtstartLocal: input.dtstartLocal,
  timeZone: input.timeZone,
  untilLocal: input.untilLocal ?? null,
});

const mapItemInput = (orgId: string, input: ContractItemInput) => ({
  orgId,
  title: input.title,
  description: input.description ?? null,
  quantity: input.quantity ?? 1,
  unitPriceCents: input.unitPriceCents ?? null,
  workTemplateId: input.workTemplateId ?? null,
});

const shapeContract = <T extends { recurrenceRule: unknown }>(contract: T) => {
  const { recurrenceRule, ...rest } = contract;
  return {
    ...rest,
    recurrence: recurrenceRule,
  };
};

export async function listServiceContracts(orgId: string, query: ServiceContractsListQuery) {
  const { q, page, pageSize, isActive } = query;
  const skip = (page - 1) * pageSize;

  const where: Prisma.ServiceContractWhereInput = { orgId };
  if (q) {
    where.name = { contains: q, mode: Prisma.QueryMode.insensitive };
  }
  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  const [total, items] = await Promise.all([
    prisma.serviceContract.count({ where }),
    prisma.serviceContract.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        customer: { select: { id: true, name: true } },
        serviceLocation: {
          select: { id: true, label: true, city: true },
        },
        recurrenceRule: {
          select: { rrule: true, dtstartLocal: true, timeZone: true, untilLocal: true },
        },
      },
    }),
  ]);

  return {
    items: items.map((contract) => ({
      id: contract.id,
      name: contract.name,
      description: contract.description,
      isActive: contract.isActive,
      customer: contract.customer,
      serviceLocation: contract.serviceLocation,
      recurrence: contract.recurrenceRule,
      createdAt: contract.createdAt,
      updatedAt: contract.updatedAt,
    })),
    page,
    pageSize,
    total,
  };
}

export async function getServiceContract(orgId: string, id: string) {
  const contract = await prisma.serviceContract.findFirst({
    where: { id, orgId },
    select: {
      id: true,
      name: true,
      description: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
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
      recurrenceRule: {
        select: { rrule: true, dtstartLocal: true, timeZone: true, untilLocal: true },
      },
      items: {
        orderBy: [{ createdAt: "asc" }],
        select: {
          id: true,
          title: true,
          description: true,
          quantity: true,
          unitPriceCents: true,
          workTemplateId: true,
        },
      },
    },
  });

  if (!contract) {
    throw contractNotFound();
  }

  return { contract: shapeContract(contract) };
}

export async function createServiceContract(orgId: string, input: ServiceContractCreateInput) {
  await ensureCustomer(orgId, input.customerId);
  if (input.serviceLocationId) {
    await ensureServiceLocation(orgId, input.customerId, input.serviceLocationId);
  }
  await ensureWorkTemplates(orgId, input.items);

  buildRecurrenceRule(mapRecurrenceInput(input.recurrence));

  const items = input.items?.map((item) => mapItemInput(orgId, item));

  const contract = await prisma.$transaction(async (tx) => {
    const recurrenceRule = await tx.recurrenceRule.create({
      data: {
        orgId,
        ...mapRecurrenceInput(input.recurrence),
      },
    });

    return tx.serviceContract.create({
      data: {
        orgId,
        customerId: input.customerId,
        serviceLocationId: input.serviceLocationId ?? null,
        name: input.name,
        description: input.description ?? null,
        isActive: input.isActive ?? true,
        recurrenceRuleId: recurrenceRule.id,
        items: items && items.length > 0 ? { create: items } : undefined,
      },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
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
        recurrenceRule: {
          select: { rrule: true, dtstartLocal: true, timeZone: true, untilLocal: true },
        },
        items: {
          orderBy: [{ createdAt: "asc" }],
          select: {
            id: true,
            title: true,
            description: true,
            quantity: true,
            unitPriceCents: true,
            workTemplateId: true,
          },
        },
      },
    });
  });

  return { contract: shapeContract(contract) };
}

export async function updateServiceContract(
  orgId: string,
  id: string,
  input: ServiceContractUpdateInput,
) {
  const existing = await prisma.serviceContract.findFirst({
    where: { id, orgId },
    select: { id: true, customerId: true, recurrenceRuleId: true },
  });

  if (!existing) {
    throw contractNotFound();
  }

  const customerId = input.customerId ?? existing.customerId;
  await ensureCustomer(orgId, customerId);

  if (input.serviceLocationId) {
    await ensureServiceLocation(orgId, customerId, input.serviceLocationId);
  }

  await ensureWorkTemplates(orgId, input.items);

  if (input.recurrence) {
    buildRecurrenceRule(mapRecurrenceInput(input.recurrence));
  }

  const data: Prisma.ServiceContractUpdateInput = {};
  if (input.customerId !== undefined) {
    data.customer = { connect: { id: input.customerId } };
  }
  if (input.serviceLocationId !== undefined) {
    data.serviceLocation = input.serviceLocationId
      ? { connect: { id: input.serviceLocationId } }
      : { disconnect: true };
  }
  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = input.description;
  if (input.isActive !== undefined) data.isActive = input.isActive;

  const items = input.items?.map((item) => mapItemInput(orgId, item));

  const contract = await prisma.$transaction(async (tx) => {
    if (input.recurrence) {
      await tx.recurrenceRule.update({
        where: { id: existing.recurrenceRuleId },
        data: mapRecurrenceInput(input.recurrence),
      });
    }

    if (input.items !== undefined) {
      await tx.contractItem.deleteMany({ where: { contractId: existing.id, orgId } });
      if (items && items.length > 0) {
        await tx.contractItem.createMany({ data: items.map((item) => ({ ...item, contractId: id })) });
      }
    }

    return tx.serviceContract.update({
      where: { id: existing.id },
      data,
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
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
        recurrenceRule: {
          select: { rrule: true, dtstartLocal: true, timeZone: true, untilLocal: true },
        },
        items: {
          orderBy: [{ createdAt: "asc" }],
          select: {
            id: true,
            title: true,
            description: true,
            quantity: true,
            unitPriceCents: true,
            workTemplateId: true,
          },
        },
      },
    });
  });

  return { contract: shapeContract(contract) };
}

export async function deleteServiceContract(orgId: string, id: string) {
  const existing = await prisma.serviceContract.findFirst({
    where: { id, orgId },
    select: { id: true, recurrenceRuleId: true },
  });

  if (!existing) {
    throw contractNotFound();
  }

  await prisma.$transaction(async (tx) => {
    await tx.serviceContract.delete({ where: { id: existing.id } });
    await tx.recurrenceRule.delete({ where: { id: existing.recurrenceRuleId } });
  });

  return { deleted: true };
}

export async function materializeServiceContractOccurrences(
  orgId: string,
  id: string,
  input: ServiceContractMaterializeInput,
) {
  const contract = await prisma.serviceContract.findFirst({
    where: { id, orgId },
    select: {
      id: true,
      recurrenceRule: {
        select: { rrule: true, dtstartLocal: true, timeZone: true, untilLocal: true },
      },
    },
  });

  if (!contract) {
    throw contractNotFound();
  }

  const latest = await prisma.generatedOccurrence.findFirst({
    where: { orgId, contractId: contract.id },
    orderBy: { startsAt: "desc" },
    select: { startsAt: true },
  });

  const now = new Date();
  const cursor = latest?.startsAt && latest.startsAt > now ? latest.startsAt : now;

  const occurrences = generateNextOccurrences(contract.recurrenceRule, cursor, input.count);

  if (occurrences.length === 0) {
    return { occurrences: [] };
  }

  await prisma.generatedOccurrence.createMany({
    data: occurrences.map((date) => ({
      orgId,
      contractId: contract.id,
      startsAt: date,
    })),
    skipDuplicates: true,
  });

  const stored = await prisma.generatedOccurrence.findMany({
    where: {
      orgId,
      contractId: contract.id,
      startsAt: { in: occurrences },
    },
    orderBy: { startsAt: "asc" },
    select: { id: true, startsAt: true },
  });

  return { occurrences: stored };
}

