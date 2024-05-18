import { ClientError } from "@kennethkeim/api-utils-core";
import axios, { type AxiosRequestConfig } from "axios";

import { IgmsErrorCode, type IgmsResponse } from "@acme/igms";

// axios.create() vs new Axios() 🤨
// https://github.com/axios/axios/issues/4710#issuecomment-1129302829
export const igmsClient = axios.create({
  baseURL: "https://www.igms.com/api",
});

export class IgmsUtil {
  public static getTokenQuerystring(token: string): string {
    return `access_token=${token}`;
  }

  public static async request<T extends IgmsResponse>(
    request: AxiosRequestConfig,
  ): Promise<T> {
    const response = await igmsClient.request(request);
    const igmsPayload = response.data as IgmsResponse;
    if (igmsPayload.error?.code === IgmsErrorCode.Unauthorized) {
      throw new ClientError(401, "IGMS token is invalid.");
    }
    return response.data as T;
  }
}
