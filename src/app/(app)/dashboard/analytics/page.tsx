"use client";

import { useQuery } from "@tanstack/react-query";
import { defaultTo, isEmpty } from "lodash";
import { Eye, Users } from "lucide-react";
import Link from "next/link";
import { Area, AreaChart, Bar, BarChart, XAxis, YAxis } from "recharts";
import { getActiveSiteStats } from "@/actions/sites";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Spinner } from "@/components/ui/spinner";
import type { ActionResponse, SiteStats } from "@/lib/types";

const chartConfig = {
  pageviews: {
    label: "Pageviews",
    color: "var(--chart-1)",
  },
  visitors: {
    label: "Visitors",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

type ActiveStatsResponse = ActionResponse<{
  site: { id: string; name: string; domain: string };
  stats: SiteStats;
}>;

export default function AnalyticsPage() {
  const {
    data: result,
    isLoading,
    isFetching,
  } = useQuery<ActiveStatsResponse>({
    queryKey: ["active-site-stats"],
    queryFn: () => getActiveSiteStats(),
  });

  if (isLoading || isFetching) {
    return (
      <div className="grid h-[calc(100vh-7rem)] w-full place-content-center">
        <Spinner className="size-6 text-primary" />
      </div>
    );
  }

  if (!result?.success) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-muted-foreground">
          {result?.error.message ?? "Add a domain to view analytics"}
        </p>
        <Link className="text-primary hover:underline" href="/dashboard">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const { site, stats } = result.data;
  const now = new Date();
  const fallbackTrend = [
    {
      date: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      pageviews: 0,
      visitors: 0,
    },
    {
      date: now.toISOString(),
      pageviews: 0,
      visitors: 0,
    },
  ];
  const totalPageviews = defaultTo(stats.totalPageviews, 0);
  const totalVisitors = defaultTo(stats.totalVisitors, 0);
  const pageviewsTrend = isEmpty(stats.pageviews)
    ? fallbackTrend
    : stats.pageviews.map((item: SiteStats["pageviews"][number]) => ({
        ...item,
        pageviews: defaultTo(item.pageviews, 0),
        visitors: defaultTo(item.visitors, 0),
      }));
  const topPages = defaultTo(stats.topPages, []).map(
    (item: SiteStats["topPages"][number]) => ({
      ...item,
      pageviews: defaultTo(item.pageviews, 0),
    })
  );
  const topReferrers = defaultTo(stats.topReferrers, []).map(
    (item: SiteStats["topReferrers"][number]) => ({
      ...item,
      pageviews: defaultTo(item.pageviews, 0),
    })
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl">Analytics</h1>
          </div>
          <p className="text-muted-foreground text-sm">{site.domain}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Total Pageviews</CardTitle>
            <Eye className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{totalPageviews.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Unique Visitors</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{totalVisitors.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pageviews Over Time</CardTitle>
          <CardDescription>Last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer className="h-[300px] w-full" config={chartConfig}>
            <AreaChart data={pageviewsTrend}>
              <XAxis
                axisLine={false}
                dataKey="date"
                tickFormatter={(value) =>
                  new Date(value).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                }
                tickLine={false}
              />
              <YAxis axisLine={false} tickLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                dataKey="pageviews"
                fill="var(--color-pageviews)"
                fillOpacity={0.2}
                stroke="var(--color-pageviews)"
                type="monotone"
              />
              <Area
                dataKey="visitors"
                fill="var(--color-visitors)"
                fillOpacity={0.2}
                stroke="var(--color-visitors)"
                type="monotone"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Pages</CardTitle>
            <CardDescription>Most visited pages</CardDescription>
          </CardHeader>
          <CardContent>
            {topPages.length > 0 ? (
              <ChartContainer className="h-[300px] w-full" config={chartConfig}>
                <BarChart data={topPages} layout="vertical">
                  <XAxis axisLine={false} tickLine={false} type="number" />
                  <YAxis
                    axisLine={false}
                    dataKey="path"
                    tickFormatter={(value) =>
                      value?.length > 20
                        ? `${value.slice(0, 20)}...`
                        : value || ""
                    }
                    tickLine={false}
                    type="category"
                    width={150}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="pageviews"
                    fill="var(--color-pageviews)"
                    radius={4}
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <p className="py-8 text-center text-muted-foreground text-sm">
                No page data yet
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Referrers</CardTitle>
            <CardDescription>Where your traffic comes from</CardDescription>
          </CardHeader>
          <CardContent>
            {topReferrers.length > 0 ? (
              <ChartContainer className="h-[300px] w-full" config={chartConfig}>
                <BarChart data={topReferrers} layout="vertical">
                  <XAxis axisLine={false} tickLine={false} type="number" />
                  <YAxis
                    axisLine={false}
                    dataKey="referrer"
                    tickFormatter={(value) => {
                      try {
                        return new URL(value).hostname;
                      } catch {
                        return value?.length > 20
                          ? `${value?.slice(0, 20)}...`
                          : value || "";
                      }
                    }}
                    tickLine={false}
                    type="category"
                    width={150}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="pageviews"
                    fill="var(--color-visitors)"
                    radius={4}
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <p className="py-8 text-center text-muted-foreground text-sm">
                No referrer data yet
              </p>
            )}
          </CardContent>
        </Card>
        {/* <UserGlobe /> */}
      </div>
    </div>
  );
}
