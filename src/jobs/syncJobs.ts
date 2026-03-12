import { setInterval } from "node:timers";

import { prisma } from "../infrastructure/db/prisma.js";

import type { Prisma, SyncJob } from "@prisma/client";

type Logger = {
  info?: (...args: unknown[]) => void;
  warn?: (...args: unknown[]) => void;
  error?: (...args: unknown[]) => void;
};

type ProcessOptions = {
  now?: Date;
  batchSize?: number;
  maxAttempts?: number;
  retryBaseMs?: number;
  logger?: Logger;
};

type ScheduleOptions = {
  intervalMs: number;
  batchSize: number;
  maxAttempts: number;
  retryBaseMs: number;
  logger?: Logger;
};

type WebhookPayload = {
  idempotencyKey?: string;
  event?: unknown;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const readWebhookPayload = (payload: Prisma.JsonValue): WebhookPayload => {
  if (!isObject(payload)) return {};
  const idempotencyKey =
    typeof payload.idempotencyKey === "string" ? payload.idempotencyKey : undefined;
  const event = Object.prototype.hasOwnProperty.call(payload, "event")
    ? payload.event
    : undefined;
  return { idempotencyKey, event };
};

const retryDelayMs = (attempt: number, retryBaseMs: number): number =>
  retryBaseMs * Math.max(1, 2 ** Math.max(0, attempt - 1));

const isRetryableError = (error: unknown): boolean => {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes("timeout") || message.includes("network")) {
      return true;
    }
  }
  return true;
};

async function markCompleted(jobId: string) {
  await prisma.syncJob.update({
    where: { id: jobId },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      lastError: null,
    },
  });
}

async function markFailed(job: SyncJob, options: Required<Pick<ProcessOptions, "maxAttempts" | "retryBaseMs">>, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const shouldRetry = job.attempts < options.maxAttempts && isRetryableError(error);

  if (shouldRetry) {
    const nextAttemptAt = new Date(Date.now() + retryDelayMs(job.attempts, options.retryBaseMs));
    await prisma.syncJob.update({
      where: { id: job.id },
      data: {
        status: "PENDING",
        scheduledAt: nextAttemptAt,
        lastError: message,
      },
    });
    return;
  }

  await prisma.syncJob.update({
    where: { id: job.id },
    data: {
      status: "FAILED",
      completedAt: new Date(),
      lastError: message,
    },
  });
}

async function processQuickBooksWebhook(job: SyncJob): Promise<"processed" | "duplicate"> {
  const payload = readWebhookPayload(job.payload);
  if (payload.idempotencyKey) {
    const duplicate = await prisma.syncJob.findFirst({
      where: {
        id: { not: job.id },
        orgId: job.orgId,
        provider: job.provider,
        connectionId: job.connectionId,
        type: job.type,
        status: "COMPLETED",
        payload: {
          equals: {
            idempotencyKey: payload.idempotencyKey,
            event: payload.event ?? null,
          },
        },
      },
      select: { id: true },
    });

    if (duplicate) {
      return "duplicate";
    }
  }

  if (job.connectionId) {
    await prisma.integrationConnection.updateMany({
      where: { id: job.connectionId, orgId: job.orgId },
      data: { lastSyncAt: new Date() },
    });
  }

  return "processed";
}

async function processJob(job: SyncJob): Promise<"processed" | "duplicate"> {
  if (job.provider === "QUICKBOOKS" && job.type === "WEBHOOK") {
    return processQuickBooksWebhook(job);
  }
  throw new Error(`Unsupported sync job handler for ${job.provider}:${job.type}`);
}

export async function processPendingSyncJobs(options: ProcessOptions = {}): Promise<number> {
  const now = options.now ?? new Date();
  const batchSize = options.batchSize ?? 20;
  const maxAttempts = options.maxAttempts ?? 5;
  const retryBaseMs = options.retryBaseMs ?? 30_000;
  const logger = options.logger ?? console;

  const candidates = await prisma.syncJob.findMany({
    where: {
      status: "PENDING",
      OR: [{ scheduledAt: null }, { scheduledAt: { lte: now } }],
    },
    orderBy: [{ scheduledAt: "asc" }, { createdAt: "asc" }],
    take: batchSize,
  });

  let processedCount = 0;

  for (const candidate of candidates) {
    const claim = await prisma.syncJob.updateMany({
      where: { id: candidate.id, status: "PENDING" },
      data: {
        status: "PROCESSING",
        startedAt: new Date(),
        attempts: { increment: 1 },
        lastError: null,
      },
    });

    if (claim.count === 0) {
      continue;
    }

    const job = await prisma.syncJob.findUnique({ where: { id: candidate.id } });
    if (!job) continue;

    try {
      const result = await processJob(job);
      await markCompleted(job.id);
      if (result === "duplicate" && typeof logger.warn === "function") {
        logger.warn({ jobId: job.id }, "Skipped duplicate sync job");
      }
      processedCount += 1;
    } catch (error) {
      await markFailed(job, { maxAttempts, retryBaseMs }, error);
      if (typeof logger.error === "function") {
        logger.error({ err: error, jobId: job.id }, "Sync job processing failed");
      }
    }
  }

  return processedCount;
}

export function scheduleSyncJobWorker(options: ScheduleOptions): () => void {
  const logger = options.logger ?? console;
  let running = false;

  const run = async () => {
    if (running) return;
    running = true;
    try {
      const processed = await processPendingSyncJobs({
        batchSize: options.batchSize,
        maxAttempts: options.maxAttempts,
        retryBaseMs: options.retryBaseMs,
        logger,
      });
      if (processed > 0 && typeof logger.info === "function") {
        logger.info({ processed }, "Sync worker processed pending job(s)");
      }
    } catch (err) {
      if (typeof logger.error === "function") {
        logger.error({ err }, "Sync worker run failed");
      }
    } finally {
      running = false;
    }
  };

  const timer = setInterval(() => {
    void run();
  }, options.intervalMs);
  timer.unref();
  void run();

  return () => {
    clearInterval(timer);
  };
}
