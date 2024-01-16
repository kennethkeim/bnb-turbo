import * as nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

import { env } from "~/env.mjs";
import { apiConfig } from "../config";

// https://app.brevo.com/settings/keys/smtp
// https://nodemailer.com/smtp/#tls-options
const smtpTransportOptions: SMTPTransport.Options = {
  auth: { user: env.MAILER_USER, pass: env.MAILER_PASS },
  host: "smtp-relay.brevo.com",
  port: 587,
  // Does not mean we're not using TLS, see nodemailer link above
  secure: false,
  // Require STARTTLS
  requireTLS: true,
};

const defaults: SMTPTransport.Options = {
  to: apiConfig.sysEventsRecipient,
  from: `"${apiConfig.appName}" <${apiConfig.sysEventsSender}>`,
  replyTo: apiConfig.sysEventsRecipient,
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
