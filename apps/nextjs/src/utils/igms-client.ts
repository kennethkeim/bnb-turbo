import axios from "axios";

import { env } from "~/env.mjs";

// axios.create() vs new Axios() 🤨
// https://github.com/axios/axios/issues/4710#issuecomment-1129302829
export const igmsClient = axios.create({
  baseURL: "https://www.igms.com/api",
});

export class IgmsUtil {
  public static getTokenQuerystring(): string {
    return `access_token=${env.TEMP_IGMS_TOKEN}`;
  }
}
