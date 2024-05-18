import { ApiError } from "@kennethkeim/api-utils-core";

export class NoActionRequiredError extends ApiError {
  public constructor(message: string) {
    super(400, message);
    // suppress stack since it's not a real exception
    this.stack = undefined;
  }
}
