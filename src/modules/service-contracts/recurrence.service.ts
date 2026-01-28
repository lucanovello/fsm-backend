import { DateTime } from "luxon";
import { RRule, type Options } from "rrule";

import { AppError } from "../../shared/errors.js";

export type RecurrenceRuleConfig = {
  rrule: string;
  dtstartLocal: string;
  timeZone: string;
  untilLocal?: string | null;
};

const invalidRecurrence = (message: string, code = "RECURRENCE_INVALID") =>
  new AppError(message, 400, { code });

const parseLocalDateTime = (value: string, timeZone: string, label: string): DateTime => {
  const parsed = DateTime.fromISO(value, { zone: timeZone });
  if (!parsed.isValid) {
    throw invalidRecurrence(`${label} must be a valid ISO datetime`, "RECURRENCE_INVALID_DATETIME");
  }
  return parsed;
};

export function buildRecurrenceRule(config: RecurrenceRuleConfig): RRule {
  let options: Partial<Options>;
  try {
    options = RRule.parseString(config.rrule);
  } catch (err) {
    throw invalidRecurrence("RRULE must be a valid RFC 5545 string", "RECURRENCE_INVALID_RRULE");
  }

  if (!config.timeZone) {
    throw invalidRecurrence("timeZone is required", "RECURRENCE_MISSING_TIMEZONE");
  }

  const dtstart = parseLocalDateTime(config.dtstartLocal, config.timeZone, "dtstartLocal");
  const until = config.untilLocal
    ? parseLocalDateTime(config.untilLocal, config.timeZone, "untilLocal")
    : null;

  if (until && until < dtstart) {
    throw invalidRecurrence("untilLocal must be on or after dtstartLocal", "RECURRENCE_UNTIL_BEFORE_START");
  }

  return new RRule({
    ...options,
    dtstart: dtstart.toJSDate(),
    until: until?.toJSDate(),
  });
}

export function generateNextOccurrences(
  config: RecurrenceRuleConfig,
  cursor: Date,
  count: number,
): Date[] {
  if (count <= 0) {
    return [];
  }

  const rule = buildRecurrenceRule(config);
  const results: Date[] = [];
  let next = rule.after(cursor, false);

  while (next && results.length < count) {
    results.push(next);
    next = rule.after(next, false);
  }

  return results;
}
