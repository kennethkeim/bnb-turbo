import { Axios } from "axios";

import { env } from "~/env.mjs";

export const igmsClient = new Axios({
  baseURL: "https://www.igms.com/api",
});

export class IgmsUtil {
  public static getTokenQuerystring(): string {
    return `access_token=${env.TEMP_IGMS_TOKEN}`;
  }
}
