import { tool } from "ai";
import { and, eq } from "drizzle-orm";
import Exa from "exa-js";
import { z } from "zod";
import { computeRange, reduceDashboardRows } from "@/actions/site-helpers";
import { db } from "@/db/drizzle";
import { sites } from "@/db/schema";
import type { auth } from "@/lib/auth";
import { SignalError } from "@/lib/errors";
import { queryPipe } from "@/lib/tinybird";
import {
  DateRangeKey,
  type DateRangeKey as DateRangeKeyType,
  Grain,
  type Grain as GrainType,
  type TinybirdSiteDashboardRow,
} from "@/lib/types";

const exa = process.env.EXA_API_KEY ? new Exa(process.env.EXA_API_KEY) : null;

const rangeSchema = z.enum(["7d", "30d", "90d"]).optional();
const grainSchema = z.enum(["day", "week", "month"]).optional();

type Session = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

export function createAssistantTools({ session }: { session: Session }) {
  return {
    getSiteTraffic: tool({
      description:
        "Get the user's active site traffic analytics (pageviews, visitors, trends, top pages, top referrers).",
      inputSchema: z.object({
        range: rangeSchema.describe("Date range: 7d, 30d, or 90d").optional(),
        grain: grainSchema
          .describe("Aggregation grain: day, week, or month")
          .optional(),
      }),
      execute: async ({
        range,
        grain,
      }: {
        range?: "7d" | "30d" | "90d";
        grain?: "day" | "week" | "month";
      }) => {
        try {
          const activeDomain = session.session.activeDomain;
          if (!activeDomain) {
            const error = SignalError.Site.NoActiveDomain();
            return { error: { code: error.code, message: error.message } };
          }

          const [site] = await db
            .select()
            .from(sites)
            .where(
              and(
                eq(sites.domain, activeDomain),
                eq(sites.ownerId, session.user.id)
              )
            )
            .limit(1);

          if (!site) {
            const error = SignalError.Site.NotFound();
            return { error: { code: error.code, message: error.message } };
          }

          const rangeKey = (range ?? DateRangeKey.Month) as DateRangeKeyType;
          const grainKey = (grain ?? Grain.Day) as GrainType;
          const { from, to } = computeRange(rangeKey);

          const rows = await queryPipe<TinybirdSiteDashboardRow>(
            "site_dashboard",
            {
              site_id: site.id,
              start: from,
              end: to,
              grain: grainKey,
              limit: 10,
            }
          );

          const aggregated = reduceDashboardRows(rows);

          return {
            site: { id: site.id, name: site.name, domain: site.domain },
            stats: {
              totalPageviews: aggregated.totalPageviews,
              totalVisitors: aggregated.totalVisitors,
              pageviews: aggregated.trend,
              topPages: aggregated.topPages,
              topReferrers: aggregated.topReferrers,
            },
          };
        } catch (e) {
          const error = SignalError.Analytics.FetchFailed();
          console.error(e);
          return { error: { code: error.code, message: error.message } };
        }
      },
    }),
    webAnswersFromExa: tool({
      description:
        "Use Exa to search the web, and Exa will give you fast, web-grounded answers.",
      inputSchema: z.object({
        query: z.string().min(1).max(200),
        numResults: z.number().int().min(1).max(10).optional(),
      }),
      execute: async ({
        query,
        numResults,
      }: {
        query: string;
        numResults?: number;
      }) => {
        if (!exa) {
          return { error: "Missing EXA_API_KEY" };
        }
        const { results } = await exa.searchAndContents(query, {
          livecrawl: "always",
          numResults: numResults ?? 5,
          text: { maxCharacters: 1200 },
        });
        return results.map((r) => ({
          title: r.title,
          url: r.url,
          publishedDate: r.publishedDate,
          snippet: r.text?.slice(0, 1200) ?? "",
        }));
      },
    }),
    webResearchFromExa: tool({
      description:
        "Use Exa to research the web, and Exa will give you long-running research with answers.",
      inputSchema: z.object({
        query: z.string().min(1).max(200),
      }),
      execute: async ({ query }: { query: string }) => {
        if (!exa) {
          return { error: "Missing EXA_API_KEY" };
        }
        const created = await exa.research.create({
          instructions: query,
          model: "exa-research",
        });

        const finished = await exa.research.pollUntilFinished(
          created.researchId,
          {
            pollInterval: 1500,
            timeoutMs: 60_000,
          }
        );

        if (finished.status !== "completed") {
          return {
            researchId: created.researchId,
            status: finished.status,
            error: "Research did not complete successfully",
          };
        }

        return {
          researchId: finished.researchId,
          status: finished.status,
          createdAt: finished.createdAt,
          finishedAt: finished.finishedAt,
          model: finished.model,
          content: finished.output.content.slice(0, 10_000),
        };
      },
    }),
  } as const;
}
