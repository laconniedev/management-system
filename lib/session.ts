// Shared by middleware (edge runtime) and server code, so no Node-only imports here.

/** Cookie that marks when this browser logged in. When it expires, the user must log in again. */
export const SESSION_COOKIE = "ms_session";

/** Sessions last 2 days. */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 2;
