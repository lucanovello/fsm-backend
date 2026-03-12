#!/usr/bin/env node

import "dotenv/config";
import process from "node:process";

import { getConfig } from "../../src/config/index.js";
import { processPendingSyncJobs, scheduleSyncJobWorker } from "../../src/jobs/syncJobs.js";
import { prisma } from "../../src/lib/prisma.js";

const args = process.argv.slice(2);
const runOnce = args.includes("--once");

const main = async () => {
  const cfg = getConfig();
  const logger = console;

  if (runOnce) {
    const processed = await processPendingSyncJobs({
      batchSize: 50,
      maxAttempts: cfg.syncJobWorker.maxAttempts,
      retryBaseMs: cfg.syncJobWorker.retryBaseMs,
      logger,
    });
    logger.info?.(`[sync-worker] processed ${processed} job(s)`);
    return;
  }

  logger.info?.("[sync-worker] starting daemon mode");
  const stopWorker = scheduleSyncJobWorker({
    logger,
    intervalMs: cfg.syncJobWorker.intervalMs,
    batchSize: 20,
    maxAttempts: cfg.syncJobWorker.maxAttempts,
    retryBaseMs: cfg.syncJobWorker.retryBaseMs,
  });

  const holdOpen = setInterval(() => undefined, 60_000);

  const shutdown = async () => {
    clearInterval(holdOpen);
    stopWorker();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());
};

main()
  .catch((error) => {
    console.error("[sync-worker] failed", error);
    process.exit(1);
  })
  .finally(async () => {
    if (runOnce) {
      await prisma.$disconnect();
    }
  });
