import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import request from "supertest";
import { createHmac } from "node:crypto";

import { prisma } from "../src/infrastructure/db/prisma.js";
import { resetConfigCache } from "../src/config/index.js";
import { resetDb } from "./utils/db.js";

let app: any;
const ORIGINAL_ENV = { ...process.env };

const QBO_KEY = Buffer.from("k".repeat(32)).toString("base64");

const stubFetchTokens = () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      access_token: "access-token",
      refresh_token: "refresh-token",
      token_type: "bearer",
      expires_in: 3600,
      x_refresh_token_expires_in: 7200,
    }),
  });
  vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);
  return fetchMock;
};

const uniqueEmail = () =>
  `user+${Date.now()}_${Math.random().toString(36).slice(2, 8)}@example.com`;

async function createUserAndOrg() {
  const email = uniqueEmail();
  const password = "Passw0rd!";

  await request(app).post("/auth/register").send({ email, password }).expect(201);
  const login = await request(app).post("/auth/login").send({ email, password }).expect(200);

  const createdOrg = await request(app)
    .post("/api/organizations")
    .set("Authorization", `Bearer ${login.body.accessToken}`)
    .send({ name: "Acme Services" })
    .expect(201);

  return {
    accessToken: login.body.accessToken as string,
    orgId: createdOrg.body.organization.id as string,
  };
}

describe("QuickBooks integrations", () => {
  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? "test-access".repeat(4);
    process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? "test-refresh".repeat(4);
    process.env.JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY ?? "15m";
    process.env.JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY ?? "7d";
    process.env.RATE_LIMIT_RPM_AUTH_REGISTER = process.env.RATE_LIMIT_RPM_AUTH_REGISTER ?? "120";
    process.env.QBO_CLIENT_ID = "test-client";
    process.env.QBO_CLIENT_SECRET = "test-secret";
    process.env.QBO_REDIRECT_URI = "https://example.com/callback";
    process.env.QBO_WEBHOOK_VERIFIER_TOKEN = "webhook-secret";
    process.env.QBO_TOKEN_ENCRYPTION_KEY = QBO_KEY;

    resetConfigCache();
    vi.resetModules();
    const mod = await import("../src/app.js");
    app = mod.default;
  });

  afterAll(() => {
    process.env = { ...ORIGINAL_ENV };
    resetConfigCache();
    vi.unstubAllGlobals();
  });

  beforeEach(async () => {
    await resetDb();
    vi.unstubAllGlobals();
  });

  test("callback stores realmId and activates connection", async () => {
    stubFetchTokens();
    const { accessToken, orgId } = await createUserAndOrg();

    const connect = await request(app)
      .post("/api/integrations/quickbooks/connect")
      .set("Authorization", `Bearer ${accessToken}`)
      .set("x-org-id", orgId)
      .expect(200);

    const state = new URL(connect.body.url).searchParams.get("state");
    if (!state) throw new Error("Missing state");

    await request(app)
      .get("/integrations/quickbooks/callback")
      .query({ code: "auth-code", realmId: "realm-123", state })
      .expect(200);

    const stored = await prisma.integrationConnection.findFirstOrThrow({
      where: { orgId, provider: "QUICKBOOKS" },
    });

    expect(stored.realmId).toBe("realm-123");
    expect(stored.isActive).toBe(true);
    expect(stored.status).toBe("ACTIVE");
    expect(stored.accessTokenCiphertext).toBeTruthy();
    expect(stored.refreshTokenCiphertext).toBeTruthy();
  });

  test("active connection selection keeps newest active", async () => {
    stubFetchTokens();
    const { accessToken, orgId } = await createUserAndOrg();

    const connect1 = await request(app)
      .post("/api/integrations/quickbooks/connect")
      .set("Authorization", `Bearer ${accessToken}`)
      .set("x-org-id", orgId)
      .expect(200);

    const state1 = new URL(connect1.body.url).searchParams.get("state");
    if (!state1) throw new Error("Missing state");

    await request(app)
      .get("/integrations/quickbooks/callback")
      .query({ code: "auth-code", realmId: "realm-111", state: state1 })
      .expect(200);

    const connect2 = await request(app)
      .post("/api/integrations/quickbooks/connect")
      .set("Authorization", `Bearer ${accessToken}`)
      .set("x-org-id", orgId)
      .expect(200);

    const state2 = new URL(connect2.body.url).searchParams.get("state");
    if (!state2) throw new Error("Missing state");

    await request(app)
      .get("/integrations/quickbooks/callback")
      .query({ code: "auth-code-2", realmId: "realm-222", state: state2 })
      .expect(200);

    const active = await request(app)
      .get("/api/integrations/quickbooks/connection")
      .set("Authorization", `Bearer ${accessToken}`)
      .set("x-org-id", orgId)
      .expect(200);

    expect(active.body.connection?.realmId).toBe("realm-222");

    const inactive = await prisma.integrationConnection.findFirstOrThrow({
      where: { orgId, realmId: "realm-111" },
    });
    expect(inactive.isActive).toBe(false);
  });

  test("webhook enqueues sync job", async () => {
    stubFetchTokens();
    const { accessToken, orgId } = await createUserAndOrg();

    const connect = await request(app)
      .post("/api/integrations/quickbooks/connect")
      .set("Authorization", `Bearer ${accessToken}`)
      .set("x-org-id", orgId)
      .expect(200);

    const state = new URL(connect.body.url).searchParams.get("state");
    if (!state) throw new Error("Missing state");

    await request(app)
      .get("/integrations/quickbooks/callback")
      .query({ code: "auth-code", realmId: "realm-333", state })
      .expect(200);

    const payload = { eventNotifications: [{ realmId: "realm-333" }] };
    const rawBody = Buffer.from(JSON.stringify(payload), "utf8");
    const signature = createHmac("sha256", "webhook-secret").update(rawBody).digest("base64");

    await request(app)
      .post("/webhooks/quickbooks")
      .set("intuit-signature", signature)
      .send(payload)
      .expect(202);

    const job = await prisma.syncJob.findFirst({
      where: { orgId, provider: "QUICKBOOKS" },
    });

    expect(job).not.toBeNull();
    expect(job?.type).toBe("WEBHOOK");
  });
});
