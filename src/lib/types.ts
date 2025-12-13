import type { chatMessages, chatThreads, sites, user } from "@/db/schema";

export type User = typeof user.$inferSelect;

export const DateRangeKey = {
  Week: "7d",
  Month: "30d",
  NinetyDays: "90d",
} as const;

export type DateRangeKey = (typeof DateRangeKey)[keyof typeof DateRangeKey];

export const Grain = {
  Day: "day",
  Week: "week",
  Month: "month",
} as const;

export type Grain = (typeof Grain)[keyof typeof Grain];

export type ActionErrorPayload = {
  code: string;
  message: string;
};

export type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: ActionErrorPayload };

export type Site = typeof sites.$inferSelect;
export type NewSite = typeof sites.$inferInsert;

export type ChatThread = typeof chatThreads.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;

export type ChatThreadListItem = {
  threadId: ChatThread["id"];
  title: ChatThread["title"];
  updatedAt: ChatThread["updatedAt"];
};

export type PageviewData = {
  date: string;
  pageviews: number;
  visitors: number;
};

export type TopPage = {
  path: string;
  pageviews: number;
};

export type TopReferrer = {
  referrer: string;
  pageviews: number;
};

export type DashboardOptions = {
  range?: DateRangeKey;
  grain?: Grain;
};

export type TinybirdSiteDashboardRow = {
  section: "totals" | "trend" | "top_pages" | "top_referrers";
  x_axis: string;
  pageviews: number;
  visitors: number;
  breakdown: string;
};

export type DashboardRow =
  | { section: "totals"; pageviews: number; visitors: number }
  | { section: "trend"; bucket: string; pageviews: number; visitors: number }
  | { section: "top_pages"; path: string; pageviews: number }
  | { section: "top_referrers"; referrer: string; pageviews: number };

export type DashboardAggregation = {
  totalPageviews: number;
  totalVisitors: number;
  trend: { date: string; pageviews: number; visitors: number }[];
  topPages: { path: string; pageviews: number }[];
  topReferrers: { referrer: string; pageviews: number }[];
};

export type TopCountry = {
  country: string;
  pageviews: number;
};

export type SiteStats = {
  totalPageviews: number;
  totalVisitors: number;
  pageviews: PageviewData[];
  topPages: TopPage[];
  topReferrers: TopReferrer[];
};
