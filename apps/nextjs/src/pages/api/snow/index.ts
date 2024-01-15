import { type NextApiRequest, type NextApiResponse } from "next";
import { DateTime } from "luxon";

import { localTZ } from "~/utils/date";
import { handleApiError, NoActionRequiredError } from "~/utils/exceptions";
import { logger } from "~/utils/logger";
import { allowMethods, auth } from "~/utils/request";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    allowMethods("POST", req.method);
    auth(req);

    res.status(200).json({
      message: `I have alerted the humans to rid the Airbnb of snow and ice.`,
    });
  } catch (error) {
    handleApiError(error, req, res);
  }
}
