import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import type { Request, Response } from "express";

vi.mock("../src/modules/integrations/quickbooks/quickbooks.service.js", () => ({
  createQuickBooksConnectUrl: vi.fn(),
  getActiveQuickBooksConnection: vi.fn(),
  handleQuickBooksCallback: vi.fn(),
  handleQuickBooksWebhook: vi.fn(),
}));

type QuickBooksServiceModule =
  typeof import("../src/modules/integrations/quickbooks/quickbooks.service.js");

let createQuickBooksConnectUrl: ReturnType<typeof vi.fn>;
let getActiveQuickBooksConnection: ReturnType<typeof vi.fn>;
let handleQuickBooksCallback: ReturnType<typeof vi.fn>;
let handleQuickBooksWebhook: ReturnType<typeof vi.fn>;

let quickBooksConnectHandler: typeof import("../src/modules/integrations/quickbooks/quickbooks.controller.js").quickBooksConnectHandler;
let quickBooksCallbackHandler: typeof import("../src/modules/integrations/quickbooks/quickbooks.controller.js").quickBooksCallbackHandler;
let quickBooksWebhookHandler: typeof import("../src/modules/integrations/quickbooks/quickbooks.controller.js").quickBooksWebhookHandler;
let quickBooksActiveConnectionHandler: typeof import("../src/modules/integrations/quickbooks/quickbooks.controller.js").quickBooksActiveConnectionHandler;

const createRes = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  } as unknown as Response;
  return res;
};

describe("quickbooks.controller", () => {
  beforeAll(async () => {
    ({
      quickBooksConnectHandler,
      quickBooksCallbackHandler,
      quickBooksWebhookHandler,
      quickBooksActiveConnectionHandler,
    } = await import("../src/modules/integrations/quickbooks/quickbooks.controller.js"));

    const service =
      (await import("../src/modules/integrations/quickbooks/quickbooks.service.js")) as QuickBooksServiceModule;
    createQuickBooksConnectUrl = vi.mocked(service.createQuickBooksConnectUrl);
    getActiveQuickBooksConnection = vi.mocked(service.getActiveQuickBooksConnection);
    handleQuickBooksCallback = vi.mocked(service.handleQuickBooksCallback);
    handleQuickBooksWebhook = vi.mocked(service.handleQuickBooksWebhook);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("quickBooksConnectHandler requires org", async () => {
    const req = {} as Request;
    const res = createRes();
    const next = vi.fn();

    await quickBooksConnectHandler(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test("quickBooksConnectHandler returns connect url", async () => {
    createQuickBooksConnectUrl.mockResolvedValue({
      url: "https://example.com",
      connectionId: "conn-1",
      stateExpiresAt: new Date().toISOString(),
    });

    const req = { org: { id: "org-1", membershipId: "m1", role: "OWNER" } } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await quickBooksConnectHandler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      url: "https://example.com",
      connectionId: "conn-1",
      stateExpiresAt: expect.any(String),
    });
  });

  test("quickBooksCallbackHandler returns connection summary", async () => {
    handleQuickBooksCallback.mockResolvedValue({ connectionId: "conn-1", realmId: "realm-1" });

    const req = {
      query: { code: "code", realmId: "realm-1", state: "state" },
    } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await quickBooksCallbackHandler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: "connected",
      connectionId: "conn-1",
      realmId: "realm-1",
    });
  });

  test("quickBooksWebhookHandler acknowledges queued", async () => {
    handleQuickBooksWebhook.mockResolvedValue({ queued: true, job: {} });

    const req = {
      get: vi.fn().mockReturnValue("signature"),
      body: { eventNotifications: [] },
    } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await quickBooksWebhookHandler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.json).toHaveBeenCalledWith({ status: "queued" });
  });

  test("quickBooksWebhookHandler acknowledges ignored", async () => {
    handleQuickBooksWebhook.mockResolvedValue({ queued: false });

    const req = {
      get: vi.fn().mockReturnValue("signature"),
      body: { eventNotifications: [] },
    } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await quickBooksWebhookHandler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.json).toHaveBeenCalledWith({ status: "ignored" });
  });

  test("quickBooksActiveConnectionHandler requires org", async () => {
    const req = {} as Request;
    const res = createRes();
    const next = vi.fn();

    await quickBooksActiveConnectionHandler(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test("quickBooksActiveConnectionHandler returns connection", async () => {
    getActiveQuickBooksConnection.mockResolvedValue({
      id: "conn-1",
      provider: "QUICKBOOKS",
      realmId: "realm-1",
      status: "ACTIVE",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const req = { org: { id: "org-1", membershipId: "m1", role: "OWNER" } } as unknown as Request;
    const res = createRes();
    const next = vi.fn();

    await quickBooksActiveConnectionHandler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      connection: expect.objectContaining({ realmId: "realm-1" }),
    });
  });
});
