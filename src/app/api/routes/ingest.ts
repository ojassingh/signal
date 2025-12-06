import { geolocation } from "@vercel/functions";
import { Elysia, t } from "elysia";

export const ingestRoutes = new Elysia()
  .post(
    "/ingest",
    async ({ body, request }) => {
      console.log("Ingest route triggered");
      const { country, city } = geolocation(request as Request);

      const tinybirdPayload = {
        timestamp: body.timestamp,
        visitor_id: body.visitor_id,
        siteId: body.siteId,
        page_url: body.page_url,
        referrer: body.referrer || "",
        event: body.event,
        path: body.path,
        country,
        city,
      };

      console.log("Ingest route payload:", tinybirdPayload);
      const TINYBIRD_API_URL =
        process.env.TINYBIRD_API_URL || "https://api.us-east.tinybird.co";

      await fetch(
        `${TINYBIRD_API_URL}/v0/events?name=events&token=${process.env.TINYBIRD_TOKEN}`,
        {
          method: "POST",
          body: JSON.stringify(tinybirdPayload),
        }
      );

      return "ok";
    },
    {
      body: t.Object({
        timestamp: t.String(),
        visitor_id: t.String(),
        siteId: t.String(),
        page_url: t.String(),
        referrer: t.Optional(t.String()),
        event: t.String(),
        path: t.String(),
      }),
    }
  )
  .options(
    "/ingest",
    () =>
      new Response(null, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      })
  );
