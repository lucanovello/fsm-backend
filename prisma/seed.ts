import "dotenv/config";
import { Role, WorkOrderPriority, WorkOrderStatus, type PrismaClient } from "@prisma/client";

import { prisma } from "../src/lib/prisma.ts";

function assertSafeToRun() {
  const nodeEnv = process.env.NODE_ENV ?? "development";
  if (nodeEnv === "production") {
    throw new Error("Refusing to run seed in production (NODE_ENV=production).");
  }

  if (process.env.ALLOW_DB_SEED !== "true") {
    throw new Error("Set ALLOW_DB_SEED=true to run prisma seed.");
  }
}

async function hashPassword(plain: string): Promise<string> {
  const argon2 = await import("argon2");
  return await argon2.hash(plain);
}

async function resetDomainTables(db: PrismaClient) {
  await db.workOrderLineItem.deleteMany();
  await db.workNote.deleteMany();
  await db.workOrder.deleteMany();
  await db.serviceLocation.deleteMany();
  await db.technician.deleteMany();
  await db.customer.deleteMany();
  console.log("Domain tables reset.");
}

type SeedUsers = {
  admin: { id: string; email: string };
  tech1: { id: string; email: string; technicianId: string };
  tech2: { id: string; email: string; technicianId: string };
};

async function upsertUser(
  db: PrismaClient,
  args: { email: string; passwordHash: string; role: Role; verifyEmail?: boolean },
) {
  const now = new Date();
  return db.user.upsert({
    where: { email: args.email },
    update: {
      password: args.passwordHash,
      role: args.role,
      ...(args.verifyEmail ? { emailVerifiedAt: now } : {}),
    },
    create: {
      email: args.email,
      password: args.passwordHash,
      role: args.role,
      ...(args.verifyEmail ? { emailVerifiedAt: now } : {}),
    },
  });
}

async function seedUsersAndTechnicians(db: PrismaClient): Promise<SeedUsers> {
  const seedPassword = process.env.SEED_PASSWORD ?? "example_db_seed_secret_please_change";
  const passwordHash = await hashPassword(seedPassword);

  const verifyEmail = true;

  const adminEmail = "admin@example.com";
  const tech1Email = "tech1@example.com";
  const tech2Email = "tech2@example.com";

  const admin = await upsertUser(db, {
    email: adminEmail,
    passwordHash,
    role: Role.ADMIN,
    verifyEmail,
  });

  const tech1 = await upsertUser(db, {
    email: tech1Email,
    passwordHash,
    role: Role.USER,
    verifyEmail,
  });

  const tech2 = await upsertUser(db, {
    email: tech2Email,
    passwordHash,
    role: Role.USER,
    verifyEmail,
  });

  const technician1 = await db.technician.upsert({
    where: { userId: tech1.id },
    update: {
      displayName: "Taylor Technician",
      phone: "+1-555-123-4567",
    },
    create: {
      userId: tech1.id,
      displayName: "Taylor Technician",
      phone: "+1-555-123-4567",
    },
  });

  const technician2 = await db.technician.upsert({
    where: { userId: tech2.id },
    update: {
      displayName: "Jordan Technician",
      phone: "+1-555-987-6543",
    },
    create: {
      userId: tech2.id,
      displayName: "Jordan Technician",
      phone: "+1-555-987-6543",
    },
  });

  return {
    admin: { id: admin.id, email: admin.email },
    tech1: { id: tech1.id, email: tech1.email, technicianId: technician1.id },
    tech2: { id: tech2.id, email: tech2.email, technicianId: technician2.id },
  };
}

type SeedCustomers = {
  customers: { id: string; name: string }[];
  locations: { id: string; label: string | null; customerId: string }[];
};

async function seedCustomersAndLocations(db: PrismaClient): Promise<SeedCustomers> {
  const customers = await Promise.all([
    db.customer.create({
      data: {
        name: "Acme Property Group",
        email: "contact@acme-property.example",
        phone: "+1-555-111-2222",
        billingAddressLine1: "500 Billing Rd",
        billingCity: "Toronto",
        billingProvince: "ON",
        billingPostalCode: "M5V 2T6",
        billingCountry: "CA",
      },
    }),
    db.customer.create({
      data: {
        name: "Greenfield Estates",
        email: "office@greenfield-estates.example",
        phone: "+1-555-333-4444",
        billingAddressLine1: "99 Accounts Ave",
        billingCity: "Mississauga",
        billingProvince: "ON",
        billingPostalCode: "L5B 3Y4",
        billingCountry: "CA",
      },
    }),
  ]);

  const locations = await Promise.all([
    db.serviceLocation.create({
      data: {
        customerId: customers[0].id,
        label: "Acme HQ",
        addressLine1: "123 Main St",
        city: "Toronto",
        province: "ON",
        postalCode: "M5V 2T6",
        country: "CA",
        latitude: 43.6426,
        longitude: -79.3871,
      },
    }),
    db.serviceLocation.create({
      data: {
        customerId: customers[0].id,
        label: "Acme Warehouse",
        addressLine1: "77 Industrial Rd",
        city: "Toronto",
        province: "ON",
        postalCode: "M4B 1B3",
        country: "CA",
        latitude: 43.7001,
        longitude: -79.4163,
      },
    }),
    db.serviceLocation.create({
      data: {
        customerId: customers[1].id,
        label: "Greenfield Main Office",
        addressLine1: "10 Garden Ave",
        city: "Mississauga",
        province: "ON",
        postalCode: "L5B 3Y4",
        country: "CA",
        latitude: 43.589,
        longitude: -79.6441,
      },
    }),
    db.serviceLocation.create({
      data: {
        customerId: customers[1].id,
        label: "Greenfield Site B",
        addressLine1: "55 Lakeshore Blvd",
        city: "Oakville",
        province: "ON",
        postalCode: "L6H 1A1",
        country: "CA",
        latitude: 43.4675,
        longitude: -79.6877,
      },
    }),
  ]);

  return {
    customers: customers.map((c) => ({ id: c.id, name: c.name })),
    locations: locations.map((l) => ({
      id: l.id,
      label: l.label ?? null,
      customerId: l.customerId,
    })),
  };
}

function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

function atLocalTime(base: Date, hour: number, minute = 0) {
  const d = new Date(base);
  d.setHours(hour, minute, 0, 0);
  return d;
}

type SeedWorkOrders = { workOrderIds: string[] };

async function seedWorkOrders(
  db: PrismaClient,
  users: SeedUsers,
  customers: SeedCustomers,
): Promise<SeedWorkOrders> {
  const today = daysFromNow(0);

  const c1 = customers.customers[0].id;
  const c2 = customers.customers[1].id;

  const locA = customers.locations[0].id;
  const locB = customers.locations[1].id;
  const locC = customers.locations[2].id;
  const locD = customers.locations[3].id;

  const wo1 = await db.workOrder.create({
    data: {
      customerId: c1,
      serviceLocationId: locA,
      assignedTechnicianId: users.tech1.technicianId,
      summary: "Seasonal HVAC inspection",
      description: "Perform seasonal inspection and replace filter if needed.",
      status: WorkOrderStatus.SCHEDULED,
      priority: WorkOrderPriority.NORMAL,
      scheduledStart: atLocalTime(daysFromNow(1), 9, 0),
      scheduledEnd: atLocalTime(daysFromNow(1), 10, 30),
    },
  });

  const wo2 = await db.workOrder.create({
    data: {
      customerId: c1,
      serviceLocationId: locB,
      assignedTechnicianId: users.tech1.technicianId,
      summary: "Replace exterior lighting fixture",
      description: "Replace damaged fixture near loading bay.",
      status: WorkOrderStatus.IN_PROGRESS,
      priority: WorkOrderPriority.HIGH,
      scheduledStart: atLocalTime(today, 11, 0),
      scheduledEnd: atLocalTime(today, 12, 0),
      actualStart: atLocalTime(today, 11, 10),
    },
  });

  const wo3 = await db.workOrder.create({
    data: {
      customerId: c2,
      serviceLocationId: locC,
      assignedTechnicianId: null, // unassigned example
      summary: "Irrigation leak check",
      description: "Investigate reported leak and estimate repair.",
      status: WorkOrderStatus.DRAFT,
      priority: WorkOrderPriority.LOW,
      scheduledStart: atLocalTime(daysFromNow(3), 14, 0),
      scheduledEnd: atLocalTime(daysFromNow(3), 15, 0),
    },
  });

  const wo4 = await db.workOrder.create({
    data: {
      customerId: c2,
      serviceLocationId: locD,
      assignedTechnicianId: users.tech2.technicianId,
      summary: "Emergency drain unclog",
      description: "Customer reports backup; urgent response required.",
      status: WorkOrderStatus.SCHEDULED,
      priority: WorkOrderPriority.URGENT,
      scheduledStart: atLocalTime(today, 16, 0),
      scheduledEnd: atLocalTime(today, 17, 30),
    },
  });

  const wo5 = await db.workOrder.create({
    data: {
      customerId: c2,
      serviceLocationId: locD,
      assignedTechnicianId: users.tech2.technicianId,
      summary: "Fence repair (completed sample)",
      description: "Repair fence panel and secure posts.",
      status: WorkOrderStatus.COMPLETED,
      priority: WorkOrderPriority.NORMAL,
      scheduledStart: atLocalTime(daysFromNow(-2), 10, 0),
      scheduledEnd: atLocalTime(daysFromNow(-2), 12, 0),
      actualStart: atLocalTime(daysFromNow(-2), 10, 5),
      actualEnd: atLocalTime(daysFromNow(-2), 11, 50),
    },
  });

  const wo6 = await db.workOrder.create({
    data: {
      customerId: c1,
      serviceLocationId: locA,
      assignedTechnicianId: users.tech1.technicianId,
      summary: "Cancelled sample job",
      description: "Customer rescheduled; closing as cancelled.",
      status: WorkOrderStatus.CANCELLED,
      priority: WorkOrderPriority.NORMAL,
      scheduledStart: atLocalTime(daysFromNow(2), 9, 30),
      scheduledEnd: atLocalTime(daysFromNow(2), 10, 30),
    },
  });

  const workOrders = [wo1, wo2, wo3, wo4, wo5, wo6];

  for (const wo of workOrders) {
    await db.workNote.create({
      data: {
        workOrderId: wo.id,
        body: `Admin note: initial context for "${wo.summary}".`,
        authorUserId: users.admin.id,
      },
    });
  }

  await db.workNote.create({
    data: {
      workOrderId: wo2.id,
      body: "Tech note: started work, checking wiring and fixture mount.",
      authorUserId: users.tech1.id,
    },
  });

  await db.workNote.create({
    data: {
      workOrderId: wo4.id,
      body: "Tech note: en route, will arrive within 30 minutes.",
      authorUserId: users.tech2.id,
    },
  });

  await db.workOrderLineItem.createMany({
    data: [
      { workOrderId: wo1.id, description: "HVAC filter", quantity: 1, unitPriceCents: 2999 },
      { workOrderId: wo2.id, description: "LED fixture", quantity: 1, unitPriceCents: 8950 },
      {
        workOrderId: wo4.id,
        description: "Drain snake service",
        quantity: 1,
        unitPriceCents: 15000,
      },
      { workOrderId: wo5.id, description: "Fence panel", quantity: 2, unitPriceCents: 4500 },
    ],
  });

  return { workOrderIds: workOrders.map((w) => w.id) };
}

async function main() {
  assertSafeToRun();

  console.log("Seeding database...");

  await resetDomainTables(prisma);

  const users = await seedUsersAndTechnicians(prisma);
  const customers = await seedCustomersAndLocations(prisma);
  const { workOrderIds } = await seedWorkOrders(prisma, users, customers);

  console.log("Seed complete");
  console.log({
    adminUserId: users.admin.id,
    techUserIds: [users.tech1.id, users.tech2.id],
    technicianIds: [users.tech1.technicianId, users.tech2.technicianId],
    customers: customers.customers.length,
    locations: customers.locations.length,
    workOrders: workOrderIds.length,
  });

  console.log("Seeded login accounts:");
  console.log(` - ${users.admin.email}`);
  console.log(` - ${users.tech1.email}`);
  console.log(` - ${users.tech2.email}`);
  console.log("   password: set SEED_PASSWORD before running (or use the documented default)");
}

main()
  .catch((e) => {
    console.error("Seed failed", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
