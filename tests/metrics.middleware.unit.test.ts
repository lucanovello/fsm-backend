import { EventEmitter } from "node:events";

import { beforeEach, describe, expect, test, vi } from "vitest";

describe("metricsMiddleware (unit)", () => {
  let client: typeof import("prom-client");
  let metricsMiddleware: typeof import("../src/http/metrics/index.js").metricsMiddleware;

  beforeEach(async () => {
    vi.resetModules();

    client = await import("prom-client");
    client.register.clear();
    client.register.resetMetrics();

    ({ metricsMiddleware } = await import("../src/http/metrics/index.js"));
  });

  test("uses derived base from originalUrl when it ends with route.path", async () => {
    const res = new EventEmitter() as any;
    res.statusCode = 200;

    const next = vi.fn();

    const req = {
      method: "GET",
      route: { path: "/login" },
      originalUrl: "/auth/login?x=1",
      baseUrl: "",
      path: "/auth/login",
    } as any;

    metricsMiddleware(req, res, next);
    res.emit("finish");

    const metric = client.register.getSingleMetric("http_requests_total") as any;
    const snapshot = await metric.get();

    expect(snapshot.values.some((v: any) => v.labels.route === "/auth/login")).toBe(true);
    expect(next).toHaveBeenCalledTimes(1);
  });

  test("falls back to req.baseUrl when derived base cannot be inferred", async () => {
    const res = new EventEmitter() as any;
    res.statusCode = 201;

    const next = vi.fn();

    const req = {
      method: "POST",
      route: { path: "/login" },
      originalUrl: "/something-else",
      baseUrl: "/auth",
      path: "/auth/login",
    } as any;

    metricsMiddleware(req, res, next);
    res.emit("finish");

    const metric = client.register.getSingleMetric("http_requests_total") as any;
    const snapshot = await metric.get();

    expect(snapshot.values.some((v: any) => v.labels.route === "/auth/login")).toBe(true);
    expect(next).toHaveBeenCalledTimes(1);
  });

  test("falls back to req.path when req.route.path is not available", async () => {
    const res = new EventEmitter() as any;
    res.statusCode = 204;

    const next = vi.fn();

    const req = {
      method: "GET",
      route: undefined,
      originalUrl: "/unknown?x=1",
      baseUrl: "",
      path: "/fallback",
    } as any;

    metricsMiddleware(req, res, next);
    res.emit("finish");

    const metric = client.register.getSingleMetric("http_requests_total") as any;
    const snapshot = await metric.get();

    expect(snapshot.values.some((v: any) => v.labels.route === "/fallback")).toBe(true);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
