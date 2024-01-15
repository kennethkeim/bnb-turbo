import { type NextApiRequest, type NextApiResponse } from "next";

import { handleApiError } from "~/utils/exceptions";
import { logger } from "~/utils/logger";
import { MathUtil } from "~/utils/math";
import { allowMethods, auth } from "~/utils/request";
import { getSnowDepth } from "~/utils/weather";
import { type LatLng } from "~/models/locations";

const FORECAST_DAYS = 5;
const LANC: LatLng = { latitude: 40.0379, longitude: -76.3055 };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    allowMethods("POST", req.method);
    auth(req);

    const snowDepth = await getSnowDepth(LANC, FORECAST_DAYS);

    const rounded = snowDepth.hourly.map((hr) => {
      return { ...hr, snowDepth: MathUtil.roundTo2Decimals(hr.snowDepth) };
    });

    const maxDepth = rounded.reduce((acc, current) => {
      const larger = current.snowDepth > acc.snowDepth ? current : acc;
      return { ...larger };
    });
    logger.info(`Max snow depth is ${maxDepth.snowDepth} at ${maxDepth.time}`);

    res.status(200).json({
      message: `I have alerted the humans to rid the Airbnb of snow and ice.`,
    });
  } catch (error) {
    handleApiError(error, req, res);
  }
}
