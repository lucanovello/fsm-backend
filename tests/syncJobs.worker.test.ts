import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../src/infrastructure/db/prisma.js", () => {
  return {
    prisma: {
      syncJob: {
        findMany: vi.fn(),
        updateMany: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      integrationConnection: {
        updateMany: vi.fn(),
      },
    },
  };
});

let prisma: any;
let processPendingSyncJobs: typeof import("../src/jobs/syncJobs.js").processPendingSyncJobs;

const baseJob = {
  id: "job-1",
  orgId: "org-1",
  provider: "QUICKBOOKS",
  connectionId: "conn-1",
  type: "WEBHOOK",
  status: "PENDING",
  payload: { idempotencyKey: "idem-1", event: { scope: "Invoice" } },
  attempts: 1,
  scheduledAt: new Date("2025-01-01T00:00:00Z"),
  startedAt: null,
  completedAt: null,
  lastError: null,
  createdAt: new Date("2025-01-01T00:00:00Z"),
  updatedAt: new Date("2025-01-01T00:00:00Z"),
};

describe("syncJobs worker", () => {
  beforeAll(async () => {
    ({ prisma } = await import("../src/infrastructure/db/prisma.js"));
    ({ processPendingSyncJobs } = await import("../src/jobs/syncJobs.js"));
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("processes pending jobs and marks them completed", async () => {
    prisma.syncJob.findMany.mockResolvedValue([baseJob]);
    prisma.syncJob.updateMany.mockResolvedValue({ count: 1 });
    prisma.syncJob.findUnique.mockResolvedValue(baseJob);
    prisma.syncJob.findFirst.mockResolvedValue(null);
    prisma.integrationConnection.updateMany.mockResolvedValue({ count: 1 });
    prisma.syncJob.update.mockResolvedValue({});

    const processed = await processPendingSyncJobs({
      batchSize: 10,
      maxAttempts: 3,
      retryBaseMs: 1000,
    });

    expect(processed).toBe(1);
    expect(prisma.syncJob.updateMany).toHaveBeenCalledWith({
      where: { id: "job-1", status: "PENDING" },
      data: {
        status: "PROCESSING",
        startedAt: expect.any(Date),
        attempts: { increment: 1 },
        lastError: null,
      },
    });
    expect(prisma.syncJob.update).toHaveBeenCalledWith({
      where: { id: "job-1" },
      data: {
        status: "COMPLETED",
        completedAt: expect.any(Date),
        lastError: null,
      },
    });
  });

  test("treats duplicate idempotency key as handled and logs warning", async () => {
    const logger = { warn: vi.fn() };
    prisma.syncJob.findMany.mockResolvedValue([baseJob]);
    prisma.syncJob.updateMany.mockResolvedValue({ count: 1 });
    prisma.syncJob.findUnique.mockResolvedValue(baseJob);
    prisma.syncJob.findFirst.mockResolvedValue({ id: "prior-job" });
    prisma.syncJob.update.mockResolvedValue({});

    const processed = await processPendingSyncJobs({ logger });

    expect(processed).toBe(1);
    expect(logger.warn).toHaveBeenCalled();
    expect(prisma.integrationConnection.updateMany).not.toHaveBeenCalled();
  });

  test("returns job to pending with retry delay on transient failure", async () => {
    const logger = { error: vi.fn() };
    prisma.syncJob.findMany.mockResolvedValue([baseJob]);
    prisma.syncJob.updateMany.mockResolvedValue({ count: 1 });
    prisma.syncJob.findUnique.mockResolvedValue(baseJob);
    prisma.syncJob.findFirst.mockResolvedValue(null);
    prisma.integrationConnection.updateMany.mockRejectedValue(new Error("network timeout"));
    prisma.syncJob.update.mockResolvedValue({});

    const processed = await processPendingSyncJobs({
      maxAttempts: 5,
      retryBaseMs: 2000,
      logger,
    });

    expect(processed).toBe(0);
    expect(prisma.syncJob.update).toHaveBeenCalledWith({
      where: { id: "job-1" },
      data: {
        status: "PENDING",
        scheduledAt: expect.any(Date),
        lastError: "network timeout",
      },
    });
    expect(logger.error).toHaveBeenCalled();
  });
});
