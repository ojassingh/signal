"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db/drizzle";
import { sites } from "@/db/schema";
import { auth } from "@/lib/auth";
import { SignalError } from "@/lib/errors";
import type { ActionResult, Site } from "@/lib/types";

export async function getUserSites(): Promise<ActionResult<Site[]>> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return SignalError.Auth.Unauthorized();
  }

  const userSites = await db
    .select()
    .from(sites)
    .where(eq(sites.ownerId, session.user.id));

  return { success: true, data: userSites };
}

export async function createSite(url: string): Promise<ActionResult<Site>> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return SignalError.Auth.Unauthorized();
  }

  try {
    new URL(url);
  } catch {
    return SignalError.Site.InvalidUrl();
  }

  const domain = new URL(url).hostname;

  const existing = await db
    .select()
    .from(sites)
    .where(eq(sites.domain, domain))
    .limit(1);

  if (existing.length > 0) {
    return SignalError.Site.AlreadyExists();
  }

  const [site] = await db
    .insert(sites)
    .values({
      ownerId: session.user.id,
      name: domain,
      domain,
    })
    .returning();

  return { success: true, data: site };
}
