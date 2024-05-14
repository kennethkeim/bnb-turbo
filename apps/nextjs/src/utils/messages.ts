import { type Cleaning, type ListingConfig } from "~/models/cleanings";
import { type SnowDepth } from "~/models/weather";
import { DTFormats } from "./date";

export const DEFAULT_MSG_4XX =
  "Bad request (you're not bad, just your request).";
export const DEFAULT_MSG_5XX = "Internal server error (don't panic).";

export const getStreetCleaningMessage = (
  cleaning: Cleaning,
  listingCfg: ListingConfig,
): string => {
  const readableDay = cleaning.start.toLocaleString(DTFormats.dateA);
  const readableStart = cleaning.start.toLocaleString(DTFormats.timeA);
  const readableEnd = cleaning.end.toLocaleString(DTFormats.timeA);
  const dayOfWeek1 = listingCfg.schedules[0].dayOfWeek;
  const dayOfWeek2 = listingCfg.schedules[1].dayOfWeek;

  return `Hi! This is an automated message to alert you of a scheduled street cleaning on ${readableDay} from ${readableStart} to ${readableEnd}. This will be happening on at least one side of ALL the streets in the neighborhood during this window of time. Generally each side of the street will be cleaned on different days. If you are parked on the street in front of the house, your side of the street is cleaned on ${dayOfWeek1} and the other side is cleaned on ${dayOfWeek2}. Please move your vehicle if needed. Thank you!`;
};

export const getSnowAlertMessage = (
  hourly: SnowDepth["hourly"],
  summary: string,
): string => {
  const rows = hourly.map((hr) => {
    const time = hr.time.toLocaleString(DTFormats.dateTimeB);
    return `<tr><td>${time}</td><td>${hr.snowDepth}"</td></tr>`;
  });
  return `
    ${summary}
    <br/><br/>
    <table cellspacing="10">
      <tr><th>Time</th><th>Snow Depth</th></tr>
      ${rows.join("")}
    </table>
  `;
};

export const getSnowSummary = (
  maxDepth: SnowDepth["hourly"][number],
  forecastHours: number,
  depthThreshold: number,
): string => {
  const readableTime = maxDepth.time.toLocaleString(DTFormats.dateTimeB);
  return `Max snow depth in next ${forecastHours} hours is ${maxDepth.snowDepth} inches at ${readableTime}. Alert threshold is > ${depthThreshold}.`;
};
