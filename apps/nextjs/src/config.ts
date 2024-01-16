/**
 * Any api-wide config that is not environment specific and not a security issue to have in code.
 * Some feature specific config may be at the top of that route's file,
 * but we don't want to scatter email addresses throughout the codebase.
 */
export const apiConfig = {
  /** App name used in error report email */
  appName: "BNB API",
  /** Email to send errors / system events / data to. */
  sysEventsRecipient: "kkeim77@gmail.com",
  /** Default sender of system events via email. */
  sysEventsSender: "system@keims.app",
};
