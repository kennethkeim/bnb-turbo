export interface TomorrowForcast {
  timelines: {
    hourly: Array<{
      /** ISO Date string */
      time: string;
      values: { snowDepth?: number; temperature?: number };
    }>;
  };
}
