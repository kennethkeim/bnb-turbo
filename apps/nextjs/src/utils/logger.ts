import { type NextApiRequest } from "next";
import winston from "winston";

import { type ApiError } from "./exceptions";

// const format = winston.format.printf(({ level, message, label, timestamp }) => {
//   return level === "warn" ? chalk.yellow(message) : message;
// });

// const format = winston.format.simple();

export interface LogAttributes {
  method?: string;
  url?: string;
  [key: string]: unknown;
}

export interface LogErrorAttributes extends LogAttributes {
  errorName: ApiError["name"];
  errorStack: ApiError["stack"];
  errorCause: Partial<ApiError["cause"]>;
  status: ApiError["status"];
}

/** Fields of the request needed for logs */
export type RequestLogFields = Pick<NextApiRequest, "method" | "url">;

/** Get the url path, without query params. */
const getLogUrl = (url?: string): string | undefined => {
  return (url ?? "").split("?")[0];
};

const _logger = winston.createLogger({
  transports: [new winston.transports.Console()],
  format: winston.format.json(),
});

export const logger = {
  debug: (message: string, attributes?: LogAttributes): void => {
    _logger.warn(message, attributes);
  },

  info: (message: string, attributes?: LogAttributes): void => {
    _logger.info(message, attributes);
  },

  warn: (message: string, attributes?: LogAttributes): void => {
    _logger.warn(message, attributes);
  },

  error: (error: ApiError, req: RequestLogFields): void => {
    const attributes: LogErrorAttributes = {
      method: req.method,
      url: getLogUrl(req.url),
      status: error.status,
      errorName: error.name,
      errorStack: error.stack,
      errorCause: {
        name: error.cause?.name,
        stack: error.cause?.stack,
        message: error.cause?.message,
      },
    };

    _logger.error(error.message, attributes);
  },
};
