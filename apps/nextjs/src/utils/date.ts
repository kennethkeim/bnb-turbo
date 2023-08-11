import { DateTime } from "luxon";

import { type Cleaning, type ListingConfig } from "~/models/cleanings";
import { NoActionRequiredError, ServiceError } from "./exceptions";
import { logger } from "./logger";

export const localTZ = "America/New_York";

export const weekdayIsNthInMonth = (date: DateTime): number => {
  const likeDaysInMonth = getLikeDaysInMonth(date.weekdayLong ?? "", date);

  const indexInMonth = likeDaysInMonth.findIndex((day) => {
    return day.startOf("day").toMillis() === date.startOf("day").toMillis();
  });

  if (indexInMonth === -1) {
    const likeDaysISO = likeDaysInMonth.map((n) => n.toISO());
    console.debug(`Date: ${date.toISO()}.`);
    console.debug(`Like days in month: ${JSON.stringify(likeDaysISO)}.`);
    throw new ServiceError(500, `Could not find weekdayIsNthInMonth value.`);
  }

  return indexInMonth + 1;
};

/** Get like week days (e.g. Wednesdays) in month. */
export const getLikeDaysInMonth = (
  dayOfWeek: string,
  date: DateTime,
): DateTime[] => {
  const startOfMonth = date.startOf("month");
  let pointer = startOfMonth;
  const likeDaysInMonth: DateTime[] = [];

  while (pointer.month === startOfMonth.month) {
    if (pointer.weekdayLong === dayOfWeek) {
      likeDaysInMonth.push(pointer);
    }
    pointer = pointer.plus({ days: 1 });
  }

  return likeDaysInMonth;
};

export const getImminentCleaning = (listingCfg: ListingConfig): Cleaning => {
  const { schedules, alertHoursBefore } = listingCfg;
  // Need to set tz since we'll be doing lots of relative date manipulation
  const now = DateTime.now().setZone(localTZ);

  // Get street cleaning start times in current month
  const cleanings = schedules.flatMap((schedule) => {
    const likeDaysInMonth = getLikeDaysInMonth(schedule.dayOfWeek, now);
    logger.debug("Like days in month.", {
      list: likeDaysInMonth.map((d) => d.toISO()),
    });
    const cleaningsInner = schedule.nthInMonth.map((n) => {
      const dayOf = likeDaysInMonth[n - 1];
      if (!dayOf) return null;
      return {
        start: dayOf.set(schedule.start),
        end: dayOf.set(schedule.end),
      };
    });
    return cleaningsInner;
  });
  logger.debug("Cleaning start times.", {
    list: cleanings.map((t) => t?.start.toISO()),
  });

  // Find imminent cleaning - if any
  const imminentCleaning = cleanings.find((cleaning) => {
    if (!cleaning) return false;
    const hoursUntilCleaning = cleaning.start.diff(now).as("hours");
    return hoursUntilCleaning >= 0 && hoursUntilCleaning < alertHoursBefore;
  });

  // Abort if no alerts needed
  if (!imminentCleaning) {
    const cleaningsIso = cleanings.map((n) => n?.start?.toISO());
    const message = `No alert needed for: ${JSON.stringify(cleaningsIso)}.`;
    throw new NoActionRequiredError(message);
  }

  return imminentCleaning;
};

/** DateTime formats */
export class DTFormats {
  /** e.g. 'Thu, Apr 20, 11:27 AM' */
  public static readonly dateTimeA: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  };

  /** e.g. 'Thursday, April 20' */
  public static readonly dateA: Intl.DateTimeFormatOptions = {
    weekday: "long",
    month: "long",
    day: "2-digit",
  };

  /** e.g. '11:27 AM' */
  public static readonly timeA: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
  };
}
