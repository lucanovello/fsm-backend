import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../src/modules/rbac/rbac.service.js", () => ({
  hasPermission: vi.fn(),
  hasSystemRole: vi.fn(),
}));

describe("rbac middlewares (unit)", () => {
  let requirePermission: typeof import("../src/http/middleware/requirePermission.js").requirePermission;
  let requireRole: typeof import("../src/http/middleware/requireOrgRole.js").requireRole;
  let hasPermission: typeof import("../src/modules/rbac/rbac.service.js").hasPermission;
  let hasSystemRole: typeof import("../src/modules/rbac/rbac.service.js").hasSystemRole;

  beforeAll(async () => {
    ({ requirePermission } = await import("../src/http/middleware/requirePermission.js"));
    ({ requireRole } = await import("../src/http/middleware/requireOrgRole.js"));
    ({ hasPermission, hasSystemRole } = await import("../src/modules/rbac/rbac.service.js"));
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("requirePermission returns 401 when req.user missing", async () => {
    const mw = requirePermission("customers:read");
    const next = vi.fn();

    await mw({} as any, {} as any, next);

    const err = next.mock.calls[0]?.[0];
    expect(err).toMatchObject({ statusCode: 401, code: "UNAUTHORIZED" });
  });

  test("requirePermission returns 400 when org context missing", async () => {
    const mw = requirePermission("customers:read");
    const next = vi.fn();

    await mw({ user: { id: "u1" } } as any, {} as any, next);

    const err = next.mock.calls[0]?.[0];
    expect(err).toMatchObject({ statusCode: 400, code: "ORG_REQUIRED" });
  });

  test("requirePermission returns 403 when permission is missing", async () => {
    vi.mocked(hasPermission).mockResolvedValue(false);

    const mw = requirePermission("customers:read");
    const next = vi.fn();

    await mw(
      { user: { id: "u1" }, org: { id: "org1", membershipId: "m1" } } as any,
      {} as any,
      next,
    );

    const err = next.mock.calls[0]?.[0];
    expect(err).toMatchObject({ statusCode: 403, code: "FORBIDDEN" });
  });

  test("requirePermission allows when permission is present", async () => {
    vi.mocked(hasPermission).mockResolvedValue(true);

    const mw = requirePermission("customers:read");
    const next = vi.fn();

    await mw(
      { user: { id: "u1" }, org: { id: "org1", membershipId: "m1" } } as any,
      {} as any,
      next,
    );

    expect(next).toHaveBeenCalledWith();
  });

  test("requireRole returns 401 when req.user missing", async () => {
    const mw = requireRole("OWNER");
    const next = vi.fn();

    await mw({} as any, {} as any, next);

    const err = next.mock.calls[0]?.[0];
    expect(err).toMatchObject({ statusCode: 401, code: "UNAUTHORIZED" });
  });

  test("requireRole returns 400 when org context missing", async () => {
    const mw = requireRole("OWNER");
    const next = vi.fn();

    await mw({ user: { id: "u1" } } as any, {} as any, next);

    const err = next.mock.calls[0]?.[0];
    expect(err).toMatchObject({ statusCode: 400, code: "ORG_REQUIRED" });
  });

  test("requireRole returns 403 when role is missing", async () => {
    vi.mocked(hasSystemRole).mockResolvedValue(false);

    const mw = requireRole("OWNER");
    const next = vi.fn();

    await mw(
      { user: { id: "u1" }, org: { id: "org1", membershipId: "m1" } } as any,
      {} as any,
      next,
    );

    const err = next.mock.calls[0]?.[0];
    expect(err).toMatchObject({ statusCode: 403, code: "FORBIDDEN" });
  });

  test("requireRole allows when role is present", async () => {
    vi.mocked(hasSystemRole).mockResolvedValue(true);

    const mw = requireRole("OWNER");
    const next = vi.fn();

    await mw(
      { user: { id: "u1" }, org: { id: "org1", membershipId: "m1" } } as any,
      {} as any,
      next,
    );

    expect(next).toHaveBeenCalledWith();
  });
});
