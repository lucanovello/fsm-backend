import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { createHmac } from "node:crypto";

import { resetConfigCache } from "../src/config/index.js";
import { prisma } from "../src/infrastructure/db/prisma.js";
import {
  createQuickBooksConnectUrl,
  handleQuickBooksCallback,
  handleQuickBooksWebhook,
} from "../src/modules/integrations/quickbooks/quickbooks.service.js";
import { AppError } from "../src/shared/errors.js";
import { decryptSecret, encryptSecret } from "../src/shared/crypto.js";
import { hashToken } from "../src/shared/tokenHash.js";
import { resetDb } from "./utils/db.js";

const ORIGINAL_ENV = { ...process.env };
const QBO_KEY = Buffer.from("k".repeat(32)).toString("base64");

beforeAll(() => {
  process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? "a".repeat(32);
  process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? "b".repeat(32);
  process.env.QBO_WEBHOOK_VERIFIER_TOKEN = "webhook-secret";
  process.env.QBO_TOKEN_ENCRYPTION_KEY = QBO_KEY;
  process.env.QBO_CLIENT_ID = "test-client";
  process.env.QBO_CLIENT_SECRET = "test-secret";
  process.env.QBO_REDIRECT_URI = "https://example.com/callback";
  resetConfigCache();
});

afterAll(() => {
  process.env = { ...ORIGINAL_ENV };
  resetConfigCache();
});

beforeEach(async () => {
  await resetDb();
  resetConfigCache();
  vi.unstubAllGlobals();
});

describe("QuickBooks service helpers", () => {
  test("encryptSecret/decryptSecret roundtrip", () => {
    const key = Buffer.from("k".repeat(32));
    const encrypted = encryptSecret("secret", key);
    const decrypted = decryptSecret(encrypted, key);
    expect(decrypted).toBe("secret");
  });

  test("webhook rejects missing signature", async () => {
    await expect(
      handleQuickBooksWebhook({
        signature: undefined,
        rawBody: Buffer.from("{}", "utf8"),
        body: {},
      }),
    ).rejects.toMatchObject({ code: "QBO_SIGNATURE_MISSING" });
  });

  test("webhook rejects invalid signature", async () => {
    await expect(
      handleQuickBooksWebhook({
        signature: "invalid",
        rawBody: Buffer.from("{}", "utf8"),
        body: {},
      }),
    ).rejects.toMatchObject({ code: "QBO_SIGNATURE_INVALID" });
  });

  test("webhook ignores payload without realmId", async () => {
    const payload = { eventNotifications: [] };
    const rawBody = Buffer.from(JSON.stringify(payload), "utf8");
    const signature = createHmac("sha256", "webhook-secret").update(rawBody).digest("base64");

    const result = await handleQuickBooksWebhook({
      signature,
      rawBody,
      body: payload,
    });

    expect(result).toEqual({ queued: false });
  });

  test("webhook ignores unknown realmId", async () => {
    const payload = { eventNotifications: [{ realmId: "realm-missing" }] };
    const rawBody = Buffer.from(JSON.stringify(payload), "utf8");
    const signature = createHmac("sha256", "webhook-secret").update(rawBody).digest("base64");

    const result = await handleQuickBooksWebhook({
      signature,
      rawBody,
      body: payload,
    });

    expect(result).toEqual({ queued: false });
  });

  test("connect rejects missing client id", async () => {
    const prev = process.env.QBO_CLIENT_ID;
    delete process.env.QBO_CLIENT_ID;
    resetConfigCache();

    await expect(createQuickBooksConnectUrl("org-1")).rejects.toMatchObject({
      code: "QBO_CONFIG_MISSING",
    });

    process.env.QBO_CLIENT_ID = prev;
    resetConfigCache();
  });

  test("callback surfaces token exchange failure", async () => {
    const org = await prisma.organization.create({
      data: { name: "Acme Services", slug: `acme-${Date.now()}` },
    });

    const state = "state-token";
    const stateHash = await hashToken(state);

    await prisma.integrationConnection.create({
      data: {
        orgId: org.id,
        provider: "QUICKBOOKS",
        status: "PENDING",
        isActive: false,
        oauthStateHash: stateHash,
        oauthStateExpiresAt: new Date(Date.now() + 60_000),
        scopes: "com.intuit.quickbooks.accounting",
      },
    });

    const fetchMock = vi.fn().mockResolvedValue({ ok: false });
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    await expect(
      handleQuickBooksCallback({ code: "auth", realmId: "realm-2", state }),
    ).rejects.toMatchObject({ code: "QBO_TOKEN_EXCHANGE_FAILED" });
  });

  test("callback rejects invalid state", async () => {
    await expect(
      handleQuickBooksCallback({
        code: "auth",
        realmId: "realm-1",
        state: "missing-state",
      }),
    ).rejects.toMatchObject({ code: "QBO_STATE_INVALID" });

    const count = await prisma.integrationConnection.count();
    expect(count).toBe(0);
  });
});
