"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Eye, Users } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { Area, AreaChart, Bar, BarChart, XAxis, YAxis } from "recharts";
import { getSiteStats } from "@/actions/sites";
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

export default function WebsitePage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = use(params);

  const { data: result, isLoading } = useQuery({
    queryKey: ["site-stats", websiteId],
    queryFn: () => getSiteStats(websiteId),
  });

  if (isLoading) {
    return (
      <div className="grid h-screen w-full place-content-center">
        <Spinner className="size-6 text-primary" />
      </div>
    );
  }

  if (!result?.success) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-muted-foreground">
          {result?.error ?? "Failed to load stats"}
        </p>
        <Link className="text-primary hover:underline" href="/dashboard">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const stats = result.data;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link
          className="rounded-lg p-2 transition-colors hover:bg-accent"
          href="/dashboard"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="font-semibold text-2xl">Analytics</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-medium text-sm">
              Total Pageviews
            </CardTitle>
            <Eye className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-3xl">
              {stats.totalPageviews.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-medium text-sm">
              Unique Visitors
            </CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-3xl">
              {stats.totalVisitors.toLocaleString()}
            </div>
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
            <AreaChart data={stats.pageviews}>
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
            {stats.topPages.length > 0 ? (
              <ChartContainer className="h-[300px] w-full" config={chartConfig}>
                <BarChart data={stats.topPages} layout="vertical">
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
            {stats.topReferrers.length > 0 ? (
              <ChartContainer className="h-[300px] w-full" config={chartConfig}>
                <BarChart data={stats.topReferrers} layout="vertical">
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
      </div>
    </div>
  );
}
