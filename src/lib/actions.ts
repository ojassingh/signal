import { desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db/drizzle";
import { session as sessionTable, sites } from "@/db/schema";
import { auth } from "@/lib/auth";
import { genericActionError, SignalError } from "@/lib/errors";
import type { ActionResponse } from "@/lib/types";

type Session = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

export async function setDefaultDomain(session: Session) {
  const [site] = await db
    .select({ domain: sites.domain })
    .from(sites)
    .where(eq(sites.ownerId, session.user.id))
    .orderBy(desc(sites.createdAt))
    .limit(1);

  if (site) {
    await db
      .update(sessionTable)
      .set({ activeDomain: site.domain })
      .where(eq(sessionTable.id, session.session.id));
    session.session.activeDomain = site.domain;
  }

  return site?.domain;
}

export function authAction<Args extends unknown[], Return>(
  fn: (ctx: { session: Session }, ...args: Args) => Promise<Return>
) {
  return async (...args: Args): Promise<ActionResponse<Return>> => {
    const session = await auth.api.getSession({
      headers: await headers(),
      query: { disableCookieCache: true },
    });

    if (!session) {
      const error = SignalError.Auth.Unauthorized();
      return {
        success: false,
        error: { code: error.code, message: error.message },
      };
    }

    if (!session.session.activeDomain) {
      await setDefaultDomain(session);
    }

    try {
      const data = await fn({ session }, ...args);
      return { success: true, data };
    } catch (error) {
      console.error(error);
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
      return { success: false, error: genericActionError };
    }
  };
}
