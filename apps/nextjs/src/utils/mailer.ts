import { Mailer } from "@kennethkeim/api-utils-core";

import { apiConfig } from "../config";

export const mailer = new Mailer(apiConfig.appName);
