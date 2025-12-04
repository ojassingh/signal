import type { sites } from "@/db/schema";

export type ActionSuccess<T> = {
  success: true;
  data: T;
};

export type ActionError = {
  success: false;
  error: string;
};

export type ActionResult<T> = ActionSuccess<T> | ActionError;

export type Site = typeof sites.$inferSelect;
export type NewSite = typeof sites.$inferInsert;

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
