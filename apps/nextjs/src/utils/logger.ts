import { type NextApiRequest } from "next";
import { type ApiError } from "@kennethkeim/api-utils-core";
import winston from "winston";

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

const _logger = winston.createLogger({
  transports: [new winston.transports.Console()],
  format: winston.format.json(),
  // TODO: set per env
  level: "debug",
});

export const logger = {
  debug: (message?: string, attributes?: LogAttributes): void => {
    _logger.debug(message ?? "Debug log", attributes);
  },

  info: (message: string, attributes?: LogAttributes): void => {
    _logger.info(message, attributes);
  },

  warn: (message: string, attributes?: LogAttributes): void => {
    _logger.warn(message, attributes);
  },

  error: (error: ApiError): void => {
    const attributes: LogErrorAttributes = {
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
