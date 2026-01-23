import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

async function flushMicrotasks(times = 5) {
  for (let i = 0; i < times; i++) {
    await Promise.resolve();
  }
}

describe("Email Service (SMTP)", () => {
  const OLD_ENV = { ...process.env };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    process.env = { ...OLD_ENV };
    vi.useRealTimers();
    vi.resetModules();
    vi.restoreAllMocks();
  });

  test("uses SMTP when configured and sends mail", async () => {
    process.env.NODE_ENV = "test";
    process.env.CORS_ORIGINS = "http://localhost:3000";
    process.env.RATE_LIMIT_REDIS_URL = "redis://cache:6379";
    process.env.JWT_ACCESS_SECRET = "a".repeat(32);
    process.env.JWT_REFRESH_SECRET = "b".repeat(32);
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_PORT = "587";
    process.env.SMTP_SECURE = "false";
    process.env.SMTP_FROM = "no-reply@example.com";

    const sendMail = vi.fn().mockResolvedValue({ messageId: "m1" });
    const createTransport = vi.fn().mockReturnValue({ sendMail });

    vi.doMock("nodemailer", () => ({
      default: { createTransport },
    }));

    const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
    vi.doMock("../src/infrastructure/logging/logger.js", () => ({
      getLogger: () => logger,
    }));

    const { getEmailService, resetEmailService } =
      await import("../src/infrastructure/email/emailService.js");
    resetEmailService();

    const svc = getEmailService();
    await svc.sendVerificationEmail("user@example.com", "CODE123");

    expect(createTransport).toHaveBeenCalled();
    expect(sendMail).toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ emailType: "verification", recipient: "user@example.com" }),
      "Verification email sent via SMTP",
    );
  });

  test("retries SMTP sendMail with backoff then succeeds", async () => {
    process.env.NODE_ENV = "test";
    process.env.CORS_ORIGINS = "http://localhost:3000";
    process.env.RATE_LIMIT_REDIS_URL = "redis://cache:6379";
    process.env.JWT_ACCESS_SECRET = "a".repeat(32);
    process.env.JWT_REFRESH_SECRET = "b".repeat(32);
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_PORT = "587";
    process.env.SMTP_SECURE = "false";
    process.env.SMTP_FROM = "no-reply@example.com";

    const sendMail = vi
      .fn()
      .mockRejectedValueOnce(new Error("fail 1"))
      .mockRejectedValueOnce(new Error("fail 2"))
      .mockResolvedValueOnce({ messageId: "m2" });

    const createTransport = vi.fn().mockReturnValue({ sendMail });
    vi.doMock("nodemailer", () => ({
      default: { createTransport },
    }));

    const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
    vi.doMock("../src/infrastructure/logging/logger.js", () => ({
      getLogger: () => logger,
    }));

    const { getEmailService, resetEmailService } =
      await import("../src/infrastructure/email/emailService.js");
    resetEmailService();
    const svc = getEmailService();

    const promise = svc.sendPasswordResetEmail("user@example.com", "RESET456");

    // withRetry waits 1s then 2s before the 3rd attempt
    expect(sendMail).toHaveBeenCalledTimes(1);

    // Let the first rejection be handled and the first sleep be scheduled.
    await flushMicrotasks();

    // Wake up the first sleep and allow the second attempt to run.
    vi.advanceTimersByTime(1000);
    await flushMicrotasks();
    expect(sendMail).toHaveBeenCalledTimes(2);

    // Let the second rejection schedule the next sleep.
    await flushMicrotasks();

    // Wake up the second sleep and allow the third attempt to run.
    vi.advanceTimersByTime(2000);
    await flushMicrotasks();
    expect(sendMail).toHaveBeenCalledTimes(3);

    await promise;
    expect(logger.warn).toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });
});
