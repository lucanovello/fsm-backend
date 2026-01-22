import { prisma } from "../../infrastructure/db/prisma.js";

import type { TechniciansListQuery } from "./dto/technicians.dto.js";

export async function listTechnicians(query: TechniciansListQuery) {
  const { page, pageSize } = query;
  const skip = (page - 1) * pageSize;

  const [total, items] = await Promise.all([
    prisma.technician.count(),
    prisma.technician.findMany({
      skip,
      take: pageSize,
      orderBy: { displayName: "asc" },
      select: {
        id: true,
        displayName: true,
        phone: true,
        user: { select: { email: true } },
      },
    }),
  ]);

  const shaped = items.map((tech) => ({
    id: tech.id,
    displayName: tech.displayName,
    email: tech.user.email,
    phone: tech.phone,
  }));

  return { items: shaped, page, pageSize, total };
}
