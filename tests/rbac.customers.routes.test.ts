import { afterAll, beforeAll, beforeEach, expect, test } from "vitest";
import request from "supertest";

import { prisma } from "../src/infrastructure/db/prisma.js";
import {
  assignSystemRoleToMember,
  ensurePermissionCatalog,
  ensureSystemRoles,
} from "../src/modules/rbac/rbac.service.js";
import { resetDb } from "./utils/db.js";

let app: any;
const ORIGINAL_ENV = { ...process.env };

beforeAll(async () => {
  process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? "test-access";
  process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? "test-refresh";
  process.env.JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY ?? "15m";
  process.env.JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY ?? "7d";
  process.env.RATE_LIMIT_RPM_AUTH_REGISTER = process.env.RATE_LIMIT_RPM_AUTH_REGISTER ?? "120";

  const mod = await import("../src/app.js");
  app = mod.default;
});

afterAll(() => {
  process.env = { ...ORIGINAL_ENV };
});

beforeEach(async () => {
  await resetDb();
});

const uniqueEmail = () =>
  `user+${Date.now()}_${Math.random().toString(36).slice(2, 8)}@example.com`;

async function registerAndLogin() {
  const email = uniqueEmail();
  const password = "Passw0rd!";

  await request(app).post("/auth/register").send({ email, password }).expect(201);

  const record = await prisma.user.findFirstOrThrow({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true },
  });

  const login = await request(app).post("/auth/login").send({ email, password }).expect(200);

  return { id: record.id, accessToken: login.body.accessToken as string };
}

async function createOrgMembership(userId: string) {
  const org = await prisma.organization.create({
    data: { name: "Acme Services", slug: `acme-${Date.now()}` },
    select: { id: true },
  });

  const member = await prisma.orgMember.create({
    data: { orgId: org.id, userId, role: "OWNER" },
    select: { id: true },
  });

  await ensurePermissionCatalog(prisma);
  await ensureSystemRoles(prisma, org.id);

  return { orgId: org.id, memberId: member.id };
}

test("customers list returns 403 without permission", async () => {
  const user = await registerAndLogin();
  const membership = await createOrgMembership(user.id);

  await request(app)
    .get("/api/customers")
    .set("Authorization", `Bearer ${user.accessToken}`)
    .set("x-org-id", membership.orgId)
    .expect(403);
});

test("customers list returns 200 when OWNER role assigned", async () => {
  const user = await registerAndLogin();
  const membership = await createOrgMembership(user.id);

  await assignSystemRoleToMember(prisma, membership.memberId, membership.orgId, "OWNER");

  const res = await request(app)
    .get("/api/customers")
    .set("Authorization", `Bearer ${user.accessToken}`)
    .set("x-org-id", membership.orgId)
    .expect(200);

  expect(res.body?.items).toBeDefined();
});
