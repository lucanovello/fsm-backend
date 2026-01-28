import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { getConfig } from "../../../config/index.js";
import { prisma } from "../../../infrastructure/db/prisma.js";
import { encryptSecret } from "../../../shared/crypto.js";
import { AppError } from "../../../shared/errors.js";
import { hashToken } from "../../../shared/tokenHash.js";

import type { SyncJob } from "@prisma/client";

const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

const configMissing = (field: string) =>
  new AppError(`QuickBooks configuration missing: ${field}`, 500, {
    code: "QBO_CONFIG_MISSING",
    expose: false,
  });

export async function createQuickBooksConnectUrl(orgId: string) {
  const cfg = getConfig();
  if (!cfg.qbo.clientId) throw configMissing("QBO_CLIENT_ID");
  if (!cfg.qbo.redirectUri) throw configMissing("QBO_REDIRECT_URI");

  const state = randomBytes(24).toString("hex");
  const stateHash = await hashToken(state);
  const stateExpiresAt = new Date(Date.now() + OAUTH_STATE_TTL_MS);

  const connection = await prisma.integrationConnection.create({
    data: {
      orgId,
      provider: "QUICKBOOKS",
      status: "PENDING",
      isActive: false,
      oauthStateHash: stateHash,
      oauthStateExpiresAt: stateExpiresAt,
      scopes: cfg.qbo.scopes.join(" "),
    },
    select: { id: true },
  });

  const authUrl = new URL(cfg.qbo.authBaseUrl);
  authUrl.searchParams.set("client_id", cfg.qbo.clientId);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", cfg.qbo.scopes.join(" "));
  authUrl.searchParams.set("redirect_uri", cfg.qbo.redirectUri);
  authUrl.searchParams.set("state", state);

  return {
    url: authUrl.toString(),
    connectionId: connection.id,
    stateExpiresAt: stateExpiresAt.toISOString(),
  };
}

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  x_refresh_token_expires_in?: number;
};

const tokenExchangeFailed = () =>
  new AppError("QuickBooks token exchange failed", 502, {
    code: "QBO_TOKEN_EXCHANGE_FAILED",
    expose: false,
  });

async function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
  const cfg = getConfig();
  if (!cfg.qbo.clientId) throw configMissing("QBO_CLIENT_ID");
  if (!cfg.qbo.clientSecret) throw configMissing("QBO_CLIENT_SECRET");
  if (!cfg.qbo.redirectUri) throw configMissing("QBO_REDIRECT_URI");

  const basic = Buffer.from(`${cfg.qbo.clientId}:${cfg.qbo.clientSecret}`, "utf8").toString(
    "base64",
  );

  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: cfg.qbo.redirectUri,
  });

  const response = await fetch(cfg.qbo.tokenUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    throw tokenExchangeFailed();
  }

  const data = (await response.json()) as TokenResponse;
  if (!data.access_token || !data.refresh_token) {
    throw tokenExchangeFailed();
  }

  return data;
}

const invalidState = () =>
  new AppError("Invalid or expired QuickBooks state", 400, {
    code: "QBO_STATE_INVALID",
  });

export async function handleQuickBooksCallback(params: {
  code: string;
  realmId: string;
  state: string;
}) {
  const cfg = getConfig();
  const stateHash = await hashToken(params.state);

  const connection = await prisma.integrationConnection.findFirst({
    where: {
      provider: "QUICKBOOKS",
      oauthStateHash: stateHash,
    },
    select: {
      id: true,
      orgId: true,
      oauthStateExpiresAt: true,
    },
  });

  if (!connection?.oauthStateExpiresAt || connection.oauthStateExpiresAt < new Date()) {
    throw invalidState();
  }

  if (!cfg.qbo.tokenEncryptionKey) {
    throw configMissing("QBO_TOKEN_ENCRYPTION_KEY");
  }

  const tokenResponse = await exchangeCodeForTokens(params.code);
  const accessTokenCiphertext = encryptSecret(
    tokenResponse.access_token,
    cfg.qbo.tokenEncryptionKey,
  );
  const refreshTokenCiphertext = encryptSecret(
    tokenResponse.refresh_token,
    cfg.qbo.tokenEncryptionKey,
  );

  const accessTokenExpiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);
  const refreshTokenExpiresAt = tokenResponse.x_refresh_token_expires_in
    ? new Date(Date.now() + tokenResponse.x_refresh_token_expires_in * 1000)
    : null;

  const updated = await prisma.$transaction(async (tx) => {
    const existing = await tx.integrationConnection.findFirst({
      where: {
        orgId: connection.orgId,
        provider: "QUICKBOOKS",
        realmId: params.realmId,
        NOT: { id: connection.id },
      },
      select: { id: true },
    });

    if (existing) {
      await tx.integrationConnection.update({
        where: { id: existing.id },
        data: { realmId: null, status: "INACTIVE", isActive: false },
      });
    }

    await tx.integrationConnection.updateMany({
      where: {
        orgId: connection.orgId,
        provider: "QUICKBOOKS",
        isActive: true,
        NOT: { id: connection.id },
      },
      data: { isActive: false, status: "INACTIVE" },
    });

    return tx.integrationConnection.update({
      where: { id: connection.id },
      data: {
        realmId: params.realmId,
        status: "ACTIVE",
        isActive: true,
        accessTokenCiphertext,
        refreshTokenCiphertext,
        accessTokenExpiresAt,
        refreshTokenExpiresAt,
        tokenType: tokenResponse.token_type,
        oauthStateHash: null,
        oauthStateExpiresAt: null,
      },
    });
  });

  return {
    connectionId: updated.id,
    realmId: updated.realmId ?? params.realmId,
  };
}

const missingSignature = () =>
  new AppError("Missing QuickBooks signature", 401, {
    code: "QBO_SIGNATURE_MISSING",
  });

const invalidSignature = () =>
  new AppError("Invalid QuickBooks signature", 401, {
    code: "QBO_SIGNATURE_INVALID",
  });

function verifySignature(payload: Buffer, signature: string, verifierToken: string): boolean {
  const expected = createHmac("sha256", verifierToken).update(payload).digest("base64");
  const expectedBuf = Buffer.from(expected, "base64");
  const signatureBuf = Buffer.from(signature, "base64");
  if (expectedBuf.length !== signatureBuf.length) {
    return false;
  }
  return timingSafeEqual(expectedBuf, signatureBuf);
}

function extractRealmId(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const notifications = (payload as { eventNotifications?: unknown }).eventNotifications;
  if (!Array.isArray(notifications)) return null;
  for (const entry of notifications) {
    if (entry && typeof entry === "object") {
      const realmId = (entry as { realmId?: unknown }).realmId;
      if (typeof realmId === "string" && realmId.length > 0) {
        return realmId;
      }
    }
  }
  return null;
}

export async function handleQuickBooksWebhook(params: {
  signature: string | undefined;
  rawBody: Buffer | undefined;
  body: unknown;
}): Promise<{ queued: boolean; job?: SyncJob } | { queued: false }> {
  const cfg = getConfig();
  if (!cfg.qbo.webhookVerifierToken) throw configMissing("QBO_WEBHOOK_VERIFIER_TOKEN");

  const signature = params.signature?.trim();
  if (!signature) throw missingSignature();

  const rawBody = params.rawBody ?? Buffer.from(JSON.stringify(params.body ?? {}), "utf8");
  if (!verifySignature(rawBody, signature, cfg.qbo.webhookVerifierToken)) {
    throw invalidSignature();
  }

  const realmId = extractRealmId(params.body);
  if (!realmId) {
    return { queued: false };
  }

  const connection = await prisma.integrationConnection.findFirst({
    where: {
      provider: "QUICKBOOKS",
      realmId,
      isActive: true,
    },
    select: { id: true, orgId: true },
  });

  if (!connection) {
    return { queued: false };
  }

  const job = await prisma.syncJob.create({
    data: {
      orgId: connection.orgId,
      provider: "QUICKBOOKS",
      connectionId: connection.id,
      type: "WEBHOOK",
      status: "PENDING",
      payload: params.body ?? {},
      scheduledAt: new Date(),
    },
  });

  return { queued: true, job };
}

export async function getActiveQuickBooksConnection(orgId: string) {
  return prisma.integrationConnection.findFirst({
    where: { orgId, provider: "QUICKBOOKS", isActive: true },
    select: {
      id: true,
      provider: true,
      realmId: true,
      status: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}
