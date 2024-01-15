import * as nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

import { env } from "~/env.mjs";
import { apiConfig } from "../config";

const smtpTransportOptions: SMTPTransport.Options = {
  service: "SendinBlue",
  auth: { user: env.MAILER_USER, pass: env.MAILER_PASS },
  secure: false,
};

const defaults: SMTPTransport.Options = {
  to: apiConfig.appEmail,
  from: `"${apiConfig.appName}" <${apiConfig.appEmail}>`,
};

interface MailOptions {
  to?: string;
  from?: string;
  subject: string;
  html: string;
}

// create reusable transporter object using credentials and defaults
const transporter = nodemailer.createTransport(smtpTransportOptions, defaults);

// automatically provide plain text version of all emails
// htmlToText is from nodemailer-html-to-text, but we probably don't need it
// it's about as big as nodemailer itself
// transporter.use("compile", htmlToText());

export async function sendMail(options: MailOptions): Promise<void> {
  await transporter.sendMail(options);
}
