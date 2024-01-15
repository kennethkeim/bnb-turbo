import * as qs from "node:querystring";
import axios from "axios";
import { DateTime } from "luxon";

import { env } from "~/env.mjs";
import { type LatLng } from "~/models/locations";
import { type TomorrowForcast } from "~/models/tomorrow";
import { type SnowDepth } from "~/models/weather";

// axios.create() vs new Axios() 🤨
// https://github.com/axios/axios/issues/4710#issuecomment-1129302829
export const tomorrowClient = axios.create({
  baseURL: "https://api.tomorrow.io",
});

/**
 * Get snow depth forecast for a location (unit: inches)\
 * All number are precise - rounding is done at presentation/usage layer.\
 */
export const getSnowDepth = async (
  latLong: LatLng,
  forecastHours: number,
): Promise<SnowDepth> => {
  const queryParams = {
    location: `${latLong.latitude},${latLong.longitude}`,
    apikey: env.WEATHER_API_KEY,
    timesteps: `1h`,
    units: `imperial`,
  };
  const queryString = qs.encode(queryParams);

  const response = await tomorrowClient.get(
    `/v4/weather/forecast?${queryString}`,
  );
  const responseData = response.data as TomorrowForcast;

  // Return only the first `forecastHours` hours of data
  return {
    hourly: responseData.timelines.hourly
      .map((hr) => {
        return {
          time: DateTime.fromISO(hr.time),
          snowDepth: hr.values.snowDepth ?? 0,
        };
      })
      .slice(0, forecastHours),
  } satisfies SnowDepth;
};
