import { expect, test, vi } from "vitest";

import { echoRequestId } from "../src/http/middleware/echoRequestId.js";

test("echoRequestId sets x-request-id when req.id is present", () => {
  const req = { id: "abc-123" } as any;
  const res = { setHeader: vi.fn() } as any;
  const next = vi.fn();

  echoRequestId(req, res, next);

  expect(res.setHeader).toHaveBeenCalledWith("x-request-id", "abc-123");
  expect(next).toHaveBeenCalledTimes(1);
});

test("echoRequestId does not set x-request-id when req.id is missing", () => {
  const req = {} as any;
  const res = { setHeader: vi.fn() } as any;
  const next = vi.fn();

  echoRequestId(req, res, next);

  expect(res.setHeader).not.toHaveBeenCalled();
  expect(next).toHaveBeenCalledTimes(1);
});
