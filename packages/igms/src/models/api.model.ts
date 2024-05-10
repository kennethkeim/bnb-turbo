export enum IgmsErrorCode {
  Failure = 0,
  ParameterError = 11,
  Unauthorized = 12,
  ApiMisconfigured = 13,
  Forbidden = 14,
  MethodNotAllowed = 15,
}

export interface IgmsError {
  message: string;
  /**
   * https://www.igms.com/docs/airgms-api/errors.html
   *
   * 0  Generic Error\
   * 11 Problems with one of method parameters\
   * 12 Problems with Access Token\
   * 13 Problems with API application\
   * 14 Problems with Access Token scope\
   * 15 API method exists but not available for use right now\
   */
  code: IgmsErrorCode;
  // ... may contain additional fields ...
}

export interface IgmsMeta {
  page?: number;
  has_next_page?: boolean;
}

/**
 * https://www.igms.com/docs/airgms-api/json-schema.html
 */
export interface IgmsResponse {
  data?: unknown;
  meta?: IgmsMeta;
  error?: IgmsError;
}

export type IgmsPlatformType =
  | "airgms"
  | "airbnb"
  | "homeaway"
  | "booking"
  | "vrbo";
