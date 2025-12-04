"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/db/drizzle";
import { sites } from "@/db/schema";
import { auth } from "@/lib/auth";
import { SignalError } from "@/lib/errors";
import { queryPipe } from "@/lib/tinybird";
import type { ActionResult, Site, SiteStats } from "@/lib/types";

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

const siteIdSchema = z.string().uuid();

export async function getSiteStats(
  siteId: string
): Promise<ActionResult<SiteStats>> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return SignalError.Auth.Unauthorized();
  }

  const validatedSiteId = siteIdSchema.parse(siteId);

  const site = await db
    .select()
    .from(sites)
    .where(eq(sites.id, validatedSiteId))
    .limit(1);

  if (site.length === 0 || site[0].ownerId !== session.user.id) {
    return SignalError.Site.NotFound();
  }

  try {
    const [totals, pageviews, topPages, topReferrers] = await Promise.all([
      queryPipe<{ pageviews: number; visitors: number }>("site_totals", {
        site_id: validatedSiteId,
      }),
      queryPipe<{ date: string; pageviews: number; visitors: number }>(
        "site_pageviews_trend",
        {
          site_id: validatedSiteId,
          days: 30,
        }
      ),
      queryPipe<{ path: string; pageviews: number }>("site_top_pages", {
        site_id: validatedSiteId,
        limit: 10,
      }),
      queryPipe<{ referrer: string; pageviews: number }>("site_top_referrers", {
        site_id: validatedSiteId,
        limit: 10,
      }),
    ]);

    return {
      success: true,
      data: {
        totalPageviews: totals[0]?.pageviews ?? 0,
        totalVisitors: totals[0]?.visitors ?? 0,
        pageviews: pageviews.reverse(),
        topPages,
        topReferrers,
      },
    };
  } catch (error) {
    console.error("Tinybird query failed:", error);
    return SignalError.Analytics.FetchFailed();
  }
}
