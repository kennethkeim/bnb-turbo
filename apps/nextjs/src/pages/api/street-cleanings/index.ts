import { type NextApiRequest, type NextApiResponse } from "next";

import { env } from "~/env.mjs";
import { type ListingConfig } from "~/models/cleanings";
import { streetCleaningHandler } from "~/services/street-cleaning.service";

const listingCfg: ListingConfig = {
  host: env.HOST_ID,
  listing: env.LISTING_ID_1,
  schedules: [
    {
      dayOfWeek: "Wednesday",
      nthInMonth: [2, 4],
      start: { hour: 8, minute: 30 },
      end: { hour: 11, minute: 30 },
    },
    {
      dayOfWeek: "Thursday",
      nthInMonth: [2, 4],
      start: { hour: 8, minute: 30 },
      end: { hour: 11, minute: 30 },
    },
  ],
  alertHoursBefore: 16,
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  await streetCleaningHandler(req, res, listingCfg);
}
