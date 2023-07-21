import { type NextApiRequest } from "next";

import { env } from "~/env.mjs";
import { ClientError } from "./exceptions";

// TODO: standardize error handling

export type HttpMethod =
  | "OPTIONS"
  | "GET"
  | "POST"
  | "PATCH"
  | "PUT"
  | "DELETE";

export const allowMethods = (
  allowed: HttpMethod,
  actual: string | undefined,
): void => {
  const actualMethod = (actual ?? "").toUpperCase() as HttpMethod;
  if (!allowed.includes(actualMethod)) {
    throw new ClientError(
      405,
      "That method is not allowed (because it's stupid).",
    );
  }
};

export const auth = (request: NextApiRequest): void => {
  if (request.query["token"] !== env.TEMP_API_TOKEN) {
    throw new ClientError(403, "Forbidden! Go away!");
  }
};
