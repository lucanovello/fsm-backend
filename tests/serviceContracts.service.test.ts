import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../src/modules/service-contracts/recurrence.service.js", () => ({
  buildRecurrenceRule: vi.fn(),
  generateNextOccurrences: vi.fn(),
}));

vi.mock("../src/infrastructure/db/prisma.js", () => {
  return {
    prisma: {
      serviceContract: {
        count: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      recurrenceRule: {
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      contractItem: {
        deleteMany: vi.fn(),
        createMany: vi.fn(),
      },
      generatedOccurrence: {
        findFirst: vi.fn(),
        createMany: vi.fn(),
        findMany: vi.fn(),
      },
      customer: {
        findFirst: vi.fn(),
      },
      serviceLocation: {
        findFirst: vi.fn(),
      },
      workTemplate: {
        count: vi.fn(),
      },
      $transaction: vi.fn(),
    },
  };
});

let prisma: any;
let buildRecurrenceRule: any;
let generateNextOccurrences: any;
let listServiceContracts: typeof import("../src/modules/service-contracts/serviceContracts.service.js").listServiceContracts;
let getServiceContract: typeof import("../src/modules/service-contracts/serviceContracts.service.js").getServiceContract;
let createServiceContract: typeof import("../src/modules/service-contracts/serviceContracts.service.js").createServiceContract;
let updateServiceContract: typeof import("../src/modules/service-contracts/serviceContracts.service.js").updateServiceContract;
let deleteServiceContract: typeof import("../src/modules/service-contracts/serviceContracts.service.js").deleteServiceContract;
let materializeServiceContractOccurrences: typeof import("../src/modules/service-contracts/serviceContracts.service.js").materializeServiceContractOccurrences;

describe("serviceContracts.service", () => {
  beforeAll(async () => {
    ({ prisma } = await import("../src/infrastructure/db/prisma.js"));
    ({ buildRecurrenceRule, generateNextOccurrences } = await import(
      "../src/modules/service-contracts/recurrence.service.js"
    ));
    ({
      listServiceContracts,
      getServiceContract,
      createServiceContract,
      updateServiceContract,
      deleteServiceContract,
      materializeServiceContractOccurrences,
    } = await import("../src/modules/service-contracts/serviceContracts.service.js"));
  });

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.$transaction.mockImplementation(async (cb: any) => cb(prisma));
  });

  test("listServiceContracts returns items", async () => {
    prisma.serviceContract.count.mockResolvedValue(1);
    prisma.serviceContract.findMany.mockResolvedValue([
      {
        id: "contract-1",
        name: "Weekly Lawn",
        description: null,
        isActive: true,
        createdAt: new Date("2025-01-01"),
        updatedAt: new Date("2025-01-02"),
        customer: { id: "cust-1", name: "Acme" },
        serviceLocation: { id: "loc-1", label: "HQ", city: "Toronto" },
        recurrenceRule: {
          rrule: "FREQ=WEEKLY;BYDAY=MO",
          dtstartLocal: "2025-01-06T09:00:00",
          timeZone: "America/New_York",
          untilLocal: null,
        },
      },
    ]);

    const result = await listServiceContracts("org-1", { page: 1, pageSize: 25 });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe("contract-1");
  });

  test("listServiceContracts applies filters", async () => {
    prisma.serviceContract.count.mockResolvedValue(0);
    prisma.serviceContract.findMany.mockResolvedValue([]);

    await listServiceContracts("org-1", { page: 1, pageSize: 25, q: "lawn", isActive: true });

    expect(prisma.serviceContract.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        orgId: "org-1",
        name: expect.any(Object),
        isActive: true,
      }),
    });
  });

  test("getServiceContract throws when missing", async () => {
    prisma.serviceContract.findFirst.mockResolvedValue(null);

    await expect(getServiceContract("org-1", "contract-1")).rejects.toMatchObject({
      statusCode: 404,
      code: "SERVICE_CONTRACT_NOT_FOUND",
    });
  });

  test("createServiceContract rejects missing customer", async () => {
    prisma.customer.findFirst.mockResolvedValue(null);

    await expect(
      createServiceContract("org-1", {
        customerId: "cust-1",
        name: "Weekly Lawn",
        recurrence: {
          rrule: "FREQ=WEEKLY;BYDAY=MO",
          dtstartLocal: "2025-01-06T09:00:00",
          timeZone: "America/New_York",
        },
      }),
    ).rejects.toMatchObject({ statusCode: 404, code: "CUSTOMER_NOT_FOUND" });
  });

  test("createServiceContract rejects invalid service location", async () => {
    prisma.customer.findFirst.mockResolvedValue({ id: "cust-1" });
    prisma.serviceLocation.findFirst.mockResolvedValue(null);

    await expect(
      createServiceContract("org-1", {
        customerId: "cust-1",
        serviceLocationId: "loc-1",
        name: "Weekly Lawn",
        recurrence: {
          rrule: "FREQ=WEEKLY;BYDAY=MO",
          dtstartLocal: "2025-01-06T09:00:00",
          timeZone: "America/New_York",
        },
      }),
    ).rejects.toMatchObject({ statusCode: 404, code: "SERVICE_LOCATION_NOT_FOUND" });
  });

  test("createServiceContract creates recurrence and contract", async () => {
    prisma.customer.findFirst.mockResolvedValue({ id: "cust-1" });
    prisma.serviceLocation.findFirst.mockResolvedValue({ id: "loc-1" });
    prisma.workTemplate.count.mockResolvedValue(0);
    prisma.recurrenceRule.create.mockResolvedValue({ id: "rule-1" });
    prisma.serviceContract.create.mockResolvedValue({
      id: "contract-1",
      name: "Weekly Lawn",
      description: null,
      isActive: true,
      createdAt: new Date("2025-01-01"),
      updatedAt: new Date("2025-01-02"),
      customer: { id: "cust-1", name: "Acme" },
      serviceLocation: null,
      recurrenceRule: {
        rrule: "FREQ=WEEKLY;BYDAY=MO",
        dtstartLocal: "2025-01-06T09:00:00",
        timeZone: "America/New_York",
        untilLocal: null,
      },
      items: [],
    });

    const result = await createServiceContract("org-1", {
      customerId: "cust-1",
      serviceLocationId: "loc-1",
      name: "Weekly Lawn",
      recurrence: {
        rrule: "FREQ=WEEKLY;BYDAY=MO",
        dtstartLocal: "2025-01-06T09:00:00",
        timeZone: "America/New_York",
      },
    });

    expect(buildRecurrenceRule).toHaveBeenCalled();
    expect(prisma.recurrenceRule.create).toHaveBeenCalled();
    expect(result.contract.id).toBe("contract-1");
  });

  test("createServiceContract rejects unknown work template", async () => {
    prisma.customer.findFirst.mockResolvedValue({ id: "cust-1" });
    prisma.workTemplate.count.mockResolvedValue(0);

    await expect(
      createServiceContract("org-1", {
        customerId: "cust-1",
        name: "Weekly Lawn",
        recurrence: {
          rrule: "FREQ=WEEKLY;BYDAY=MO",
          dtstartLocal: "2025-01-06T09:00:00",
          timeZone: "America/New_York",
        },
        items: [{ title: "Mow", quantity: 1, workTemplateId: "tpl-1" }],
      }),
    ).rejects.toMatchObject({ statusCode: 404, code: "WORK_TEMPLATE_NOT_FOUND" });
  });

  test("updateServiceContract replaces items and recurrence", async () => {
    prisma.serviceContract.findFirst.mockResolvedValue({
      id: "contract-1",
      customerId: "cust-1",
      recurrenceRuleId: "rule-1",
    });
    prisma.customer.findFirst.mockResolvedValue({ id: "cust-1" });
    prisma.workTemplate.count.mockResolvedValue(0);
    prisma.serviceContract.update.mockResolvedValue({
      id: "contract-1",
      name: "Updated",
      description: null,
      isActive: true,
      createdAt: new Date("2025-01-01"),
      updatedAt: new Date("2025-01-02"),
      customer: { id: "cust-1", name: "Acme" },
      serviceLocation: null,
      recurrenceRule: {
        rrule: "FREQ=WEEKLY;BYDAY=MO",
        dtstartLocal: "2025-01-06T09:00:00",
        timeZone: "America/New_York",
        untilLocal: null,
      },
      items: [],
    });

    await updateServiceContract("org-1", "contract-1", {
      name: "Updated",
      items: [{ title: "Mow", quantity: 1 }],
      recurrence: {
        rrule: "FREQ=WEEKLY;BYDAY=MO",
        dtstartLocal: "2025-01-06T09:00:00",
        timeZone: "America/New_York",
      },
      serviceLocationId: null,
    });

    expect(prisma.recurrenceRule.update).toHaveBeenCalledWith({
      where: { id: "rule-1" },
      data: expect.objectContaining({ rrule: "FREQ=WEEKLY;BYDAY=MO" }),
    });
    expect(prisma.contractItem.deleteMany).toHaveBeenCalled();
    expect(prisma.contractItem.createMany).toHaveBeenCalled();
  });

  test("updateServiceContract rejects missing contract", async () => {
    prisma.serviceContract.findFirst.mockResolvedValue(null);

    await expect(
      updateServiceContract("org-1", "contract-1", { name: "Updated" }),
    ).rejects.toMatchObject({ statusCode: 404, code: "SERVICE_CONTRACT_NOT_FOUND" });
  });

  test("deleteServiceContract deletes contract and recurrence", async () => {
    prisma.serviceContract.findFirst.mockResolvedValue({
      id: "contract-1",
      recurrenceRuleId: "rule-1",
    });

    await deleteServiceContract("org-1", "contract-1");

    expect(prisma.serviceContract.delete).toHaveBeenCalledWith({ where: { id: "contract-1" } });
    expect(prisma.recurrenceRule.delete).toHaveBeenCalledWith({ where: { id: "rule-1" } });
  });

  test("deleteServiceContract rejects missing contract", async () => {
    prisma.serviceContract.findFirst.mockResolvedValue(null);

    await expect(deleteServiceContract("org-1", "contract-1")).rejects.toMatchObject({
      statusCode: 404,
      code: "SERVICE_CONTRACT_NOT_FOUND",
    });
  });

  test("materializeServiceContractOccurrences stores unique occurrences", async () => {
    prisma.serviceContract.findFirst.mockResolvedValue({
      id: "contract-1",
      recurrenceRule: {
        rrule: "FREQ=WEEKLY;BYDAY=MO",
        dtstartLocal: "2025-01-06T09:00:00",
        timeZone: "America/New_York",
        untilLocal: null,
      },
    });
    prisma.generatedOccurrence.findFirst.mockResolvedValue(null);

    const nextDates = [new Date("2025-01-06T14:00:00Z")];
    generateNextOccurrences.mockReturnValue(nextDates);

    prisma.generatedOccurrence.findMany.mockResolvedValue([
      { id: "occ-1", startsAt: nextDates[0] },
    ]);

    const result = await materializeServiceContractOccurrences("org-1", "contract-1", {
      count: 1,
    });

    expect(prisma.generatedOccurrence.createMany).toHaveBeenCalledWith({
      data: [
        {
          orgId: "org-1",
          contractId: "contract-1",
          startsAt: nextDates[0],
        },
      ],
      skipDuplicates: true,
    });
    expect(result.occurrences).toHaveLength(1);
  });

  test("materializeServiceContractOccurrences returns empty when no dates", async () => {
    prisma.serviceContract.findFirst.mockResolvedValue({
      id: "contract-1",
      recurrenceRule: {
        rrule: "FREQ=WEEKLY;BYDAY=MO",
        dtstartLocal: "2025-01-06T09:00:00",
        timeZone: "America/New_York",
        untilLocal: null,
      },
    });
    prisma.generatedOccurrence.findFirst.mockResolvedValue(null);
    generateNextOccurrences.mockReturnValue([]);

    const result = await materializeServiceContractOccurrences("org-1", "contract-1", {
      count: 2,
    });

    expect(result.occurrences).toEqual([]);
    expect(prisma.generatedOccurrence.createMany).not.toHaveBeenCalled();
  });

  test("materializeServiceContractOccurrences rejects missing contract", async () => {
    prisma.serviceContract.findFirst.mockResolvedValue(null);

    await expect(
      materializeServiceContractOccurrences("org-1", "contract-1", { count: 1 }),
    ).rejects.toMatchObject({ statusCode: 404, code: "SERVICE_CONTRACT_NOT_FOUND" });
  });
});
