import type { ActionError } from "./types";

export const SignalError = {
  Auth: {
    Unauthorized: (): ActionError => ({
      success: false,
      error: "You must be signed in to do this",
    }),
    SessionExpired: (): ActionError => ({
      success: false,
      error: "Your session has expired",
    }),
  },
  Site: {
    InvalidUrl: (): ActionError => ({
      success: false,
      error: "Invalid URL format",
    }),
    AlreadyExists: (): ActionError => ({
      success: false,
      error: "This site already exists",
    }),
    NotFound: (): ActionError => ({
      success: false,
      error: "Site not found",
    }),
  },
};
