import { type NextApiRequest, type NextApiResponse } from "next";

import { env } from "~/env.mjs";

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
  response: NextApiResponse,
): void => {
  const actualMethod = (actual ?? "").toUpperCase() as HttpMethod;
  if (!allowed.includes(actualMethod)) {
    response.status(405).json({ message: "Method not allowed." });
    throw new Error(`Method ${actualMethod} not allowed.`);
  }
};

export const auth = (
  request: NextApiRequest,
  response: NextApiResponse,
): void => {
  if (request.query["token"] !== env.TEMP_API_TOKEN) {
    response.status(403).send(`Why are you even here? Go away.`);
    throw new Error(
      `Someone tried to hit my API and I'm too lazy / new to Next to implement proper error handling.`,
    );
  }
};
