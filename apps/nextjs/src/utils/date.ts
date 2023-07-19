import { type NextApiResponse } from "next";
import { DateTime } from "luxon";

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
    throw new Error(`Could not find weekdayIsNthInMonth value.`);
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

export interface StreetCleaningSchedule {
  listing: string;
  dayOfWeek: string;
  nthInMonth: number[];
  start: { hour: number; minute: number };
  end: { hour: number; minute: number };
  alertHoursBefore: number;
}

export const getImminentCleaning = (
  schedule: Omit<StreetCleaningSchedule, "end">,
  res: NextApiResponse,
): DateTime | null => {
  // Need to set tz since we'll be doing lots of relative date manipulation
  const now = DateTime.now().setZone(localTZ);

  // Get street cleaning start times in current month
  const likeDaysInMonth = getLikeDaysInMonth(schedule.dayOfWeek, now);
  const cleaningStartTimes = schedule.nthInMonth.map((n) => {
    const dayOf = likeDaysInMonth[n - 1];
    if (!dayOf) return null;
    const { hour, minute } = schedule.start;
    return dayOf.set({ hour, minute });
  });

  // Find imminent cleaning - if any
  const imminentCleaning = cleaningStartTimes.find((cleaningStart) => {
    if (!cleaningStart) return false;
    const hoursUntilCleaning = cleaningStart.diff(now).as("hours");
    return (
      hoursUntilCleaning >= 0 && hoursUntilCleaning < schedule.alertHoursBefore
    );
  });

  // Abort if no alerts needed
  if (!imminentCleaning) {
    const cleaningsIso = cleaningStartTimes.map((n) => n?.toISO());
    const message = `No alert needed for: ${JSON.stringify(cleaningsIso)}.`;
    console.warn(message);
    res.status(400).send(message);
    return null;
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
