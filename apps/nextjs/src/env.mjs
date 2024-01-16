import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app isn't
   * built with invalid env vars.
   */
  server: {
    DATABASE_URL: z.string().url(),
    TEMP_IGMS_TOKEN: z.string(),
    LISTING_ID_1: z.string(),
    TEMP_API_TOKEN: z.string(),
    MAILER_USER: z.string().email(),
    MAILER_PASS: z.string().min(3),
    WEATHER_API_KEY: z.string().min(3),
    SYS_EVENTS_SENDER: z.string(),
    SYS_EVENTS_RECIPIENT: z.string(),
  },
  /**
   * Specify your client-side environment variables schema here.
   * For them to be exposed to the client, prefix them with `NEXT_PUBLIC_`.
   */
  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string(),
  },
  /**
   * Destructure all variables from `process.env` to make sure they aren't tree-shaken away.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    TEMP_IGMS_TOKEN: process.env.TEMP_IGMS_TOKEN,
    LISTING_ID_1: process.env.LISTING_ID_1,
    TEMP_API_TOKEN: process.env.TEMP_API_TOKEN,
    MAILER_USER: process.env.MAILER_USER,
    MAILER_PASS: process.env.MAILER_PASS,
    WEATHER_API_KEY: process.env.WEATHER_API_KEY,
    SYS_EVENTS_SENDER: process.env.SYS_EVENTS_SENDER,
    SYS_EVENTS_RECIPIENT: process.env.SYS_EVENTS_RECIPIENT,
    // NEXT_PUBLIC_CLIENTVAR: process.env.NEXT_PUBLIC_CLIENTVAR,
  },
  skipValidation: !!process.env.CI || !!process.env.SKIP_ENV_VALIDATION,
});
