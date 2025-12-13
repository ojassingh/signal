import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { genericActionError, SignalError } from "@/lib/errors";
import type { ActionResponse } from "@/lib/types";

type Session = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

export function authAction<Args extends unknown[], Return>(
  fn: (ctx: { session: Session }, ...args: Args) => Promise<Return>
) {
  return async (...args: Args): Promise<ActionResponse<Return>> => {
    const sessionHeaders = await headers();
    const session = await auth.api.getSession({
      headers: sessionHeaders,
    });

    if (!session) {
      const error = SignalError.Auth.Unauthorized();
      return {
        success: false,
        error: { code: error.code, message: error.message },
      };
    }

    try {
      const data = await fn({ session }, ...args);
      return { success: true, data };
    } catch (error) {
      if (error instanceof SignalError) {
        return {
          success: false,
          error: {
            code: error.code,
            message: error.isPublic
              ? error.message
              : genericActionError.message,
          },
        };
      }

      console.error(error);
      return { success: false, error: genericActionError };
    }
  };
}
