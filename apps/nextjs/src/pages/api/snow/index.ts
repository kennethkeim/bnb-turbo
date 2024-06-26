import { type NextApiRequest, type NextApiResponse } from "next";
import {
  allowMethods,
  authRequest,
  handleApiError,
} from "@kennethkeim/api-utils-core";

import { logger } from "~/utils/logger";
import { mailer } from "~/utils/mailer";
import { MathUtil } from "~/utils/math";
import { getSnowAlertMessage, getSnowSummary } from "~/utils/messages";
import { getSnowDepth } from "~/utils/weather";
import { env } from "~/env.mjs";
import { type LatLng } from "~/models/locations";

const FORECAST_HOURS = 48;
const LANC: LatLng = { latitude: 40.0379, longitude: -76.3055 };
/** Snow depth threshold in inches */
const DEPTH_THRESHOLD = 0;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    allowMethods(["POST"], req.method);
    authRequest(req.headers, env.TEMP_API_TOKEN);

    const snowDepth = await getSnowDepth(LANC, FORECAST_HOURS);

    const rounded = snowDepth.hourly.map((hr) => {
      return { ...hr, snowDepth: MathUtil.roundTo2Decimals(hr.snowDepth) };
    });

    const maxDepth = rounded.reduce((acc, current) => {
      const larger = current.snowDepth > acc.snowDepth ? current : acc;
      return { ...larger };
    });

    const summary = getSnowSummary(maxDepth, FORECAST_HOURS, DEPTH_THRESHOLD);
    logger.info(summary);

    if (maxDepth.snowDepth > DEPTH_THRESHOLD) {
      await mailer.send({
        subject: "Airbnb Snow Alert",
        html: getSnowAlertMessage(rounded, summary),
      });
    }

    res.status(200).json({ message: summary });
  } catch (error) {
    await handleApiError(error, logger, mailer, res);
  }
}
