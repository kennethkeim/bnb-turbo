import { type Cleaning, type ListingConfig } from "~/models/cleanings";
import { DTFormats } from "./date";

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
