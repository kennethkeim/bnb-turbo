import { fetchWeatherApi } from "openmeteo";

import { type LatLng } from "~/models/locations";
import { type SnowDepth } from "~/models/weather";

const INCHES_PER_METER = 39.3701;

/**
 * Get snow depth forecast for a location (unit: inches)\
 * All number are precise - rounding is done at presentation/usage layer.\
 * Code generated from
 * https://open-meteo.com/en/docs/gfs-api#latitude=40.0379&longitude=-76.3055&hourly=snow_depth&daily=&forecast_days=1
 */
export const getSnowDepth = async (
  latLong: LatLng,
  forecastDays: number,
): Promise<SnowDepth> => {
  // Note: order of params matters!
  const params = {
    latitude: latLong.latitude,
    longitude: latLong.longitude,
    hourly: "snow_depth",
    forecast_days: forecastDays,
  };
  const url = "https://api.open-meteo.com/v1/gfs";
  const responses = await fetchWeatherApi(url, params);

  // Helper function to form time ranges
  const range = (start: number, stop: number, step: number) =>
    Array.from({ length: (stop - start) / step }, (_, i) => start + i * step);

  // Process first location. Add a for-loop for multiple locations or weather models
  const response = responses[0];
  if (!response) throw new Error("No response from weather API");

  // Attributes for timezone and location
  const utcOffsetSeconds = response.utcOffsetSeconds();

  const hourly = response.hourly();
  if (!hourly || !hourly.variables(0))
    throw new Error("No hourly data in weather API response");

  // Note: The order of weather variables in the URL query and the indices below need to match!
  const weatherData = {
    hourly: {
      time: range(
        Number(hourly.time()),
        Number(hourly.timeEnd()),
        hourly.interval(),
      ).map((t) => new Date((t + utcOffsetSeconds) * 1000)),
      snowDepth: hourly.variables(0)?.valuesArray(),
    },
  } as const;

  const snowDepth: SnowDepth = {
    hourly: weatherData.hourly.time.map((time, i) => {
      const snowDepth = weatherData.hourly.snowDepth?.[i];
      if (snowDepth === undefined) throw new Error("snowDepth is undefined");
      return { time, snowDepth: snowDepth * INCHES_PER_METER };
    }),
  };

  return snowDepth;
};
