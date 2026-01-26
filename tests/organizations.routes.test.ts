import { afterAll, beforeAll, beforeEach, expect, test } from "vitest";
import request from "supertest";

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

async function createUser() {
  const email = uniqueEmail();
  const password = "Passw0rd!";

  await request(app).post("/auth/register").send({ email, password }).expect(201);

  const login = await request(app).post("/auth/login").send({ email, password }).expect(200);

  return { accessToken: login.body.accessToken as string };
}

test("organizations list requires auth", async () => {
  await request(app).get("/api/organizations").expect(401);
});

test("create organization and list for current user", async () => {
  const user = await createUser();

  const created = await request(app)
    .post("/api/organizations")
    .set("Authorization", `Bearer ${user.accessToken}`)
    .send({ name: "Acme Services" })
    .expect(201);

  expect(created.body?.organization?.name).toBe("Acme Services");
  expect(created.body?.organization?.slug).toBe("acme-services");
  expect(created.body?.organization?.role).toBe("OWNER");

  const list = await request(app)
    .get("/api/organizations")
    .set("Authorization", `Bearer ${user.accessToken}`)
    .expect(200);

  expect(list.body?.count).toBe(1);
  expect(list.body?.items?.[0]).toMatchObject({
    name: "Acme Services",
    slug: "acme-services",
    role: "OWNER",
  });
});
