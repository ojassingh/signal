import type { ActionErrorPayload } from "./types";

type SignalErrorProps = {
  code: string;
  message: string;
  isPublic?: boolean;
};

export const genericActionError: ActionErrorPayload = {
  code: "INTERNAL_SERVER_ERROR",
  message: "Something went wrong",
};

export class SignalError extends Error {
  code: string;
  isPublic: boolean;

  private constructor(props: SignalErrorProps) {
    super(props.message);
    this.code = props.code;
    this.isPublic = props.isPublic ?? true;
  }

  static Auth = {
    Unauthorized: (): SignalError =>
      new SignalError({
        code: "AUTH_UNAUTHORIZED",
        message: "You must be signed in to do this",
        isPublic: true,
      }),
    SessionExpired: (): SignalError =>
      new SignalError({
        code: "AUTH_SESSION_EXPIRED",
        message: "Your session has expired",
        isPublic: true,
      }),
  };

  static Site = {
    AlreadyExists: (): SignalError =>
      new SignalError({
        code: "SITE_ALREADY_EXISTS",
        message: "This site already exists",
        isPublic: true,
      }),
    InvalidUrl: (): SignalError =>
      new SignalError({
        code: "SITE_INVALID_URL",
        message: "Invalid URL format",
        isPublic: true,
      }),
    NotFound: (): SignalError =>
      new SignalError({
        code: "SITE_NOT_FOUND",
        message: "Site not found",
        isPublic: true,
      }),
    NoActiveDomain: (): SignalError =>
      new SignalError({
        code: "SITE_NO_ACTIVE_DOMAIN",
        message: "No active domain found for this user",
        isPublic: true,
      }),
  };

  static Analytics = {
    FetchFailed: (): SignalError =>
      new SignalError({
        code: "ANALYTICS_FETCH_FAILED",
        message: "Failed to fetch analytics data",
        isPublic: false,
      }),
  };

  static Chat = {
    ThreadIdRequired: (): SignalError =>
      new SignalError({
        code: "CHAT_THREAD_ID_REQUIRED",
        message: "Missing thread id",
        isPublic: true,
      }),
    ThreadNotFound: (): SignalError =>
      new SignalError({
        code: "CHAT_THREAD_NOT_FOUND",
        message: "Chat thread not found",
        isPublic: true,
      }),
    CreateThreadFailed: (): SignalError =>
      new SignalError({
        code: "CHAT_CREATE_THREAD_FAILED",
        message: "Failed to create chat thread",
        isPublic: true,
      }),
    PersistFailed: (): SignalError =>
      new SignalError({
        code: "CHAT_PERSIST_FAILED",
        message: "Failed to save chat history",
        isPublic: true,
      }),
  };
}
