import { type NextApiResponse } from "next";

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
