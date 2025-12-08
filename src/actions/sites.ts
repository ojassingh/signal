"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db/drizzle";
import { sites } from "@/db/schema";
import { auth } from "@/lib/auth";
import { SignalError } from "@/lib/errors";
import { queryPipe } from "@/lib/tinybird";
import type {
  ActionResult,
  DashboardOptions,
  DashboardRow,
  Site,
  SiteStats,
} from "@/lib/types";
import { DateRangeKey, Grain } from "@/lib/types";
import {
  computeRange,
  reduceDashboardRows,
  siteIdSchema,
} from "./site-helpers";

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

export async function getSiteStats(
  siteId: string,
  options: DashboardOptions = {}
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

  const rangeKey = options.range ?? DateRangeKey.Month;
  const grain = options.grain ?? Grain.Day;
  const { from, to } = computeRange(rangeKey);

  try {
    const rows = await queryPipe<DashboardRow>("site_dashboard", {
      site_id: validatedSiteId,
      from,
      to,
      grain,
      limit: 10,
    });

    const aggregated = reduceDashboardRows(rows);

    return {
      success: true,
      data: {
        totalPageviews: aggregated.totalPageviews,
        totalVisitors: aggregated.totalVisitors,
        pageviews: aggregated.trend,
        topPages: aggregated.topPages,
        topReferrers: aggregated.topReferrers,
      },
    };
  } catch (error) {
    console.error("Tinybird query failed:", error);
    return SignalError.Analytics.FetchFailed();
  }
}
