import { type NextApiRequest, type NextApiResponse } from "next";

import { allowMethods } from "~/utils/request";

export default function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  allowMethods("GET", request.method, response);

  response.status(200).json({
    body: request.body,
    query: request.query,
    cookies: request.cookies,
  });
}
