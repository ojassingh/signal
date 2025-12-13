"use server";

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { session as sessionTable, sites } from "@/db/schema";
import { authAction } from "@/lib/actions";
import { SignalError } from "@/lib/errors";
import { queryPipe } from "@/lib/tinybird";
import type { DashboardOptions, DashboardRow, Site, User } from "@/lib/types";
import { DateRangeKey, Grain } from "@/lib/types";
import { computeRange, reduceDashboardRows } from "./site-helpers";

export const getSidebarData = authAction(
  async ({
    session,
  }): Promise<{
    user: Partial<User>;
    sites: Site[];
    activeDomain: string | null;
  }> => {
    const userSites = await db
      .select()
      .from(sites)
      .where(eq(sites.ownerId, session.user.id))
      .orderBy(desc(sites.createdAt));

    const [storedSession] = await db
      .select({ activeDomain: sessionTable.activeDomain })
      .from(sessionTable)
      .where(eq(sessionTable.id, session.session.id))
      .limit(1);

    const storedActiveDomain = storedSession?.activeDomain ?? null;
    const activeDomain = storedActiveDomain ?? userSites[0]?.domain ?? null;

    if (activeDomain && activeDomain !== storedActiveDomain) {
      await db
        .update(sessionTable)
        .set({ activeDomain })
        .where(eq(sessionTable.id, session.session.id));
    }

    return {
      user: {
        name: session.user.name,
        email: session.user.email,
        image: session.user.image ?? null,
      },
      sites: userSites,
      activeDomain,
    };
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

export const getActiveSiteStats = authAction(
  async ({ session }, options: DashboardOptions = {}) => {
    const [storedSession] = await db
      .select({ activeDomain: sessionTable.activeDomain })
      .from(sessionTable)
      .where(eq(sessionTable.id, session.session.id))
      .limit(1);
    const activeDomain = storedSession?.activeDomain ?? null;

    if (!activeDomain) {
      throw SignalError.Site.NoActiveDomain();
    }

    const site = await db
      .select()
      .from(sites)
      .where(
        and(eq(sites.domain, activeDomain), eq(sites.ownerId, session.user.id))
      )
      .limit(1);

    if (site.length === 0) {
      throw SignalError.Site.NotFound();
    }

    const rangeKey = options.range ?? DateRangeKey.Month;
    const grain = options.grain ?? Grain.Day;
    const { from, to } = computeRange(rangeKey);

    const rows = await queryPipe<DashboardRow>("site_dashboard", {
      site_id: site[0].id,
      from,
      to,
      grain,
      limit: 10,
    }).catch(() => {
      throw SignalError.Analytics.FetchFailed();
    });

    const aggregated = reduceDashboardRows(rows);

    return {
      site: {
        id: site[0].id,
        name: site[0].name,
        domain: site[0].domain,
      },
      stats: {
        totalPageviews: aggregated.totalPageviews,
        totalVisitors: aggregated.totalVisitors,
        pageviews: aggregated.trend,
        topPages: aggregated.topPages,
        topReferrers: aggregated.topReferrers,
      },
    };
  }
);

export const setActiveDomain = authAction(
  async ({ session }, domain: string) => {
    const site = await db
      .select()
      .from(sites)
      .where(and(eq(sites.domain, domain), eq(sites.ownerId, session.user.id)))
      .limit(1);

    if (site.length === 0) {
      throw SignalError.Site.NotFound();
    }

    await db
      .update(sessionTable)
      .set({ activeDomain: domain })
      .where(eq(sessionTable.id, session.session.id));

    return {
      activeDomain: domain,
      siteId: site[0].id,
    };
  }
);
