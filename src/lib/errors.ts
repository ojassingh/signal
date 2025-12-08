type SignalErrorProps = {
  code: string;
  message: string;
  isPublic?: boolean;
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
  };

  static Analytics = {
    FetchFailed: (): SignalError =>
      new SignalError({
        code: "ANALYTICS_FETCH_FAILED",
        message: "Failed to fetch analytics data",
        isPublic: false,
      }),
  };
}
