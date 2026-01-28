import { DateTime } from "luxon";
import { describe, expect, test } from "vitest";

import {
  buildRecurrenceRule,
  generateNextOccurrences,
} from "../src/modules/service-contracts/recurrence.service.js";

describe("recurrence.service", () => {
  test("generateNextOccurrences returns UTC dates", () => {
    const config = {
      rrule: "FREQ=DAILY;INTERVAL=1",
      dtstartLocal: "2025-01-01T09:00:00",
      timeZone: "America/New_York",
    };

    const cursor = new Date("2024-12-31T00:00:00Z");
    const result = generateNextOccurrences(config, cursor, 2);

    const first = DateTime.fromISO("2025-01-01T09:00:00", { zone: "America/New_York" })
      .toUTC()
      .toISO();
    const second = DateTime.fromISO("2025-01-02T09:00:00", { zone: "America/New_York" })
      .toUTC()
      .toISO();

    expect(result.map((date) => date.toISOString())).toEqual([first, second]);
  });

  test("generateNextOccurrences respects untilLocal", () => {
    const config = {
      rrule: "FREQ=DAILY;INTERVAL=1",
      dtstartLocal: "2025-01-01T09:00:00",
      timeZone: "America/New_York",
      untilLocal: "2025-01-03T09:00:00",
    };

    const cursor = new Date("2024-12-31T00:00:00Z");
    const result = generateNextOccurrences(config, cursor, 10);

    expect(result).toHaveLength(3);
  });

  test("generateNextOccurrences returns empty for non-positive count", () => {
    const config = {
      rrule: "FREQ=DAILY;INTERVAL=1",
      dtstartLocal: "2025-01-01T09:00:00",
      timeZone: "America/New_York",
    };

    const result = generateNextOccurrences(config, new Date(), 0);
    expect(result).toEqual([]);
  });

  test("buildRecurrenceRule rejects untilLocal before dtstartLocal", () => {
    expect(() =>
      buildRecurrenceRule({
        rrule: "FREQ=DAILY;INTERVAL=1",
        dtstartLocal: "2025-01-03T09:00:00",
        timeZone: "America/New_York",
        untilLocal: "2025-01-01T09:00:00",
      }),
    ).toThrow(/untilLocal/i);
  });

  test("buildRecurrenceRule rejects invalid rrule", () => {
    expect(() =>
      buildRecurrenceRule({
        rrule: "FREQ=NOT_A_RULE",
        dtstartLocal: "2025-01-01T09:00:00",
        timeZone: "America/New_York",
      }),
    ).toThrow(/invalid/i);
  });
});
