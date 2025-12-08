"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { sites } from "@/db/schema";
import { authAction } from "@/lib/actions";
import { SignalError } from "@/lib/errors";
import { queryPipe } from "@/lib/tinybird";
import type {
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

export const getUserSites = authAction(
  async ({ session }): Promise<{ sites: Site[] }> => {
    const userSites = await db
      .select()
      .from(sites)
      .where(eq(sites.ownerId, session.user.id));

    return { sites: userSites };
  }
);

export const createSite = authAction(
  async ({ session }, url: string): Promise<Site> => {
    if (!URL.canParse(url)) {
      throw SignalError.Site.InvalidUrl();
    }

    const parsedUrl = new URL(url);
    const domain = parsedUrl.hostname;

    const existing = await db
      .select()
      .from(sites)
      .where(eq(sites.domain, domain))
      .limit(1);

    if (existing.length > 0) {
      throw SignalError.Site.AlreadyExists();
    }

    const [site] = await db
      .insert(sites)
      .values({
        ownerId: session.user.id,
        name: domain,
        domain,
      })
      .returning();

    return site;
  }
);

export const getSiteStats = authAction(
  async (
    { session },
    siteId: string,
    options: DashboardOptions = {}
  ): Promise<SiteStats> => {
    const validatedSiteId = siteIdSchema.safeParse(siteId);

    if (!validatedSiteId.success) {
      throw SignalError.Site.NotFound();
    }

    const site = await db
      .select()
      .from(sites)
      .where(eq(sites.id, validatedSiteId.data))
      .limit(1);

    if (site.length === 0 || site[0].ownerId !== session.user.id) {
      throw SignalError.Site.NotFound();
    }

    const rangeKey = options.range ?? DateRangeKey.Month;
    const grain = options.grain ?? Grain.Day;
    const { from, to } = computeRange(rangeKey);

    const rows = await queryPipe<DashboardRow>("site_dashboard", {
      site_id: validatedSiteId.data,
      from,
      to,
      grain,
      limit: 10,
    }).catch(() => {
      throw SignalError.Analytics.FetchFailed();
    });

    const aggregated = reduceDashboardRows(rows);

    return {
      totalPageviews: aggregated.totalPageviews,
      totalVisitors: aggregated.totalVisitors,
      pageviews: aggregated.trend,
      topPages: aggregated.topPages,
      topReferrers: aggregated.topReferrers,
    };
  }
);
