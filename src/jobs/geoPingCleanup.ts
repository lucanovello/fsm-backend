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
