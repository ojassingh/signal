"use server";

import { first, groupBy, map } from "lodash";
import { z } from "zod";
import {
  type DashboardAggregation,
  type DashboardRow,
  DateRangeKey,
} from "@/lib/types";

export const siteIdSchema = z.string().uuid();

function rangeDays(range: DateRangeKey): number {
  const daysMap: Record<DateRangeKey, number> = {
    [DateRangeKey.Week]: 7,
    [DateRangeKey.Month]: 30,
    [DateRangeKey.NinetyDays]: 90,
  };
  return daysMap[range] ?? 30;
}

export function computeRange(range: DateRangeKey): {
  from: string;
  to: string;
} {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - rangeDays(range) + 1);
  return { from: from.toISOString(), to: to.toISOString() };
}

export function reduceDashboardRows(
  rows: DashboardRow[]
): DashboardAggregation {
  const grouped = groupBy(rows, "section");
  const totals = first(
    grouped.totals as Extract<DashboardRow, { section: "totals" }>[] | undefined
  ) ?? { pageviews: 0, visitors: 0 };

  return {
    totalPageviews: totals.pageviews ?? 0,
    totalVisitors: totals.visitors ?? 0,
    trend: map(
      (grouped.trend as Extract<DashboardRow, { section: "trend" }>[]) ?? [],
      (row) => ({
        date: row.bucket,
        pageviews: row.pageviews ?? 0,
        visitors: row.visitors ?? 0,
      })
    ),
    topPages: map(
      (grouped.top_pages as Extract<
        DashboardRow,
        { section: "top_pages" }
      >[]) ?? [],
      (row) => ({
        path: row.path ?? "",
        pageviews: row.pageviews ?? 0,
      })
    ),
    topReferrers: map(
      (grouped.top_referrers as Extract<
        DashboardRow,
        { section: "top_referrers" }
      >[]) ?? [],
      (row) => ({
        referrer: row.referrer ?? "",
        pageviews: row.pageviews ?? 0,
      })
    ),
  };
}
