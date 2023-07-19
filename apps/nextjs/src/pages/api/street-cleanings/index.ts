import { type NextApiRequest, type NextApiResponse } from "next";

import { type StreetCleaningSchedule } from "~/utils/date";
import { env } from "~/env.mjs";
import { streetCleaningHandler } from "~/services/street-cleaning.service";

const schedule: StreetCleaningSchedule = {
  listing: env.LISTING_ID_1,
  dayOfWeek: "Wednesday",
  nthInMonth: [2, 4],
  start: { hour: 8, minute: 30 },
  end: { hour: 11, minute: 30 },
  alertHoursBefore: 16,
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  await streetCleaningHandler(req, res, schedule);
}
