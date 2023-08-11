import { type DateTime } from "luxon";

export interface Cleaning {
  start: DateTime;
  end: DateTime;
}

export interface Schedule {
  dayOfWeek: string;
  nthInMonth: number[];
  start: { hour: number; minute: number };
  end: { hour: number; minute: number };
}

export interface ListingConfig {
  listing: string;
  /** Note: schedule 0 will be assumed to be the primary side of the street for the listing. See guest message for details. */
  schedules: [Schedule, Schedule];
  alertHoursBefore: number;
}
