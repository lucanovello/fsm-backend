import { setInterval } from "node:timers";

import { getConfig } from "../config/index.js";
import { prisma } from "../infrastructure/db/prisma.js";

export async function cleanupGeoPings(reference: Date = new Date()): Promise<number> {
  const orgs = await prisma.organization.findMany({
    select: { id: true, geoRetentionDays: true },
  });

  let removed = 0;

  for (const org of orgs) {
    const retentionDays = Math.max(1, org.geoRetentionDays ?? 365);
    const cutoff = new Date(reference.getTime() - retentionDays * 24 * 60 * 60 * 1000);
    const result = await prisma.geoPing.deleteMany({
      where: {
        orgId: org.id,
        recordedAt: { lt: cutoff },
      },
    });
    removed += result.count;
  }

  return removed;
}

type Logger = {
  info?: (...args: unknown[]) => void;
  error?: (...args: unknown[]) => void;
};

type ScheduleOptions = {
  intervalMs?: number;
  logger?: Logger;
};

export function scheduleGeoPingCleanup(options: ScheduleOptions = {}): () => void {
  const cfg = getConfig();
  const intervalMs = options.intervalMs ?? cfg.GEO_PING_CLEANUP_INTERVAL_MINUTES * 60 * 1000;
  const logger = options.logger ?? console;

  let running = false;

  const runCleanup = async () => {
    if (running) return;
    running = true;
    try {
      const removed = await cleanupGeoPings();
      if (removed > 0 && typeof logger.info === "function") {
        logger.info(`[geoPingCleanup] removed ${removed} stale geo ping(s)`);
      }
    } catch (err) {
      if (typeof logger.error === "function") {
        logger.error("[geoPingCleanup] cleanup failed", err);
      }
    } finally {
      running = false;
    }
  };

  const timer = setInterval(() => {
    void runCleanup();
  }, intervalMs);
  timer.unref();

  void runCleanup();

  return () => {
    clearInterval(timer);
  };
}
