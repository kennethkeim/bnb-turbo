import { type NextApiRequest, type NextApiResponse } from "next";
import { type HttpStatusCode } from "axios";

import { logger } from "./logger";
import { mailer } from "./mailer";
import { DEFAULT_MSG_4XX, DEFAULT_MSG_5XX } from "./messages";

type ClientErrorCode =
  | HttpStatusCode.Unauthorized
  | HttpStatusCode.Forbidden
  | HttpStatusCode.BadRequest
  | HttpStatusCode.MethodNotAllowed;

type ServiceErrorCode =
  | HttpStatusCode.ServiceUnavailable
  | HttpStatusCode.InternalServerError
  | HttpStatusCode.GatewayTimeout;

/**
 * "HTTP status codes are extensible."\
 * https://www.rfc-editor.org/rfc/rfc2616#section-6.1.1
 *
 * This is useful for cron job schedulers that don't store the response body.
 */
enum CustomHttpStatus {
  NoActionRequired = 230,
}

export class ApiError extends Error {
  cause?: Error;

  protected constructor(
    public status: HttpStatusCode | CustomHttpStatus,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }

  /** Set `cause` on existing `ApiError`. */
  public setCause(cause: Error): ApiError {
    this.cause = cause;
    return this;
  }

  /**
   * Instantiate new `ApiError` from an existing `Error`.
   * I don't think this is a good idea - in most cases
   * you probably want to wrap original `Error` by setting `cause`.
   *
   * Even in the very generic `getApiError` below, we want to have a
   * separate message from the original `Error`.
   */
  // public static fromError(error: Error, status?: HttpStatusCode): ApiError {
  //   const apiError = new ApiError(status ?? 500, error.message);
  //   if (error.cause) apiError.setCause(getError(error.cause));
  //   if (error.stack) apiError.setStack(error.stack);
  //   return apiError;
  // }
}

export class ClientError extends ApiError {
  public constructor(status?: ClientErrorCode, message?: string) {
    super(status ?? 400, message ?? DEFAULT_MSG_4XX);
  }
}

export class NoActionRequiredError extends ApiError {
  public constructor(message: string) {
    super(CustomHttpStatus.NoActionRequired, message);
    // suppress stack since it's not a real exception
    this.stack = undefined;
  }
}

export class ServiceError extends ApiError {
  public constructor(status?: ServiceErrorCode, message?: string) {
    super(status ?? 500, message ?? DEFAULT_MSG_5XX);
  }
}

/** https://medium.com/with-orus/the-5-commandments-of-clean-error-handling-in-typescript-93a9cbdf1af5 */
export const getError = (value: unknown): Error => {
  if (value instanceof Error) return value;

  let stringified = "[Unable to stringify the thrown value]";
  try {
    stringified = JSON.stringify(value);
  } catch {}

  return new Error(`[Stringified Error]: ${stringified}`);
};

export const getApiError = (value: unknown): ApiError => {
  if (value instanceof ApiError) return value;
  return new ServiceError().setCause(getError(value));
};

export const handleApiError = async (
  error: unknown,
  req?: NextApiRequest,
  res?: NextApiResponse,
): Promise<void> => {
  const apiError = getApiError(error);
  logger.error(apiError, req ?? {});
  const cause = apiError.cause;

  try {
    // Can't fire and forget from serverless fn
    await mailer.send({
      subject: "BNB API Error",
      html: `
          <pre>Status: ${apiError.status}</pre>
          <pre>${apiError.stack}</pre>
          <pre>${cause?.stack ?? "No nested error"}</pre>`,
    });
  } catch (err) {
    console.log("Error sending email for error.");
  }

  res?.status(apiError.status).json({ message: apiError.message });
};
