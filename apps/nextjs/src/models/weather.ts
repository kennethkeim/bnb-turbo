import { type DateTime } from "luxon";

export interface SnowDepth {
  hourly: Array<{ time: DateTime; snowDepth: number }>;
}
