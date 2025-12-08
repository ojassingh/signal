import arcjet, { detectBot, fixedWindow } from "@arcjet/node";
import { Hono } from "hono";
import { cors } from "hono/cors";

type Env = {
  ENVIRONMENT?: string;
  TINYBIRD_TOKEN: string;
  TINYBIRD_API_URL: string;
  ARCJET_KEY?: string;
};

type IngestPayload = {
  timestamp: string;
  visitor_id?: string;
  siteId: string;
  page_url: string;
  referrer?: string;
  event: string;
  path: string;
  user_agent: string;
};

const app = new Hono<{ Bindings: Env }>();

app.use(
  "/ingest",
  cors({
    origin: "*",
    allowMethods: ["POST", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  })
);

app.post("/ingest", async (c) => {
  if (c.env.ARCJET_KEY && c.env.ENVIRONMENT && c.env.ENVIRONMENT !== "LOCAL") {
    const aj = arcjet({
      key: c.env.ARCJET_KEY,
      characteristics: ["ip.src"],
      rules: [
        fixedWindow({ mode: "LIVE", window: "1m", max: 100 }),
        detectBot({
          mode: "LIVE",
          allow: [
            "CATEGORY:SEARCH_ENGINE",
            "CATEGORY:PREVIEW",
            "CATEGORY:MONITOR",
            "CATEGORY:AI",
          ],
        }),
      ],
    });

    const decision = await aj.protect({
      method: c.req.method,
      url: c.req.url,
      headers: c.req.header(),
    });
    if (decision.isDenied()) {
      console.log("[ARCJET] Decision", decision.reason.type);
      return c.json(
        {
          source: "ARCJET",
          reason: decision.reason.type,
        },
        429
      );
    }
  }

  const body = await c.req.json<IngestPayload>();
  const cf = c.req.raw.cf as { country?: string; city?: string } | undefined;

  const cleanDate = (body.timestamp || new Date().toISOString())
    .replace("T", " ")
    .replace("Z", "")
    .split(".")[0];

  const tinybirdPayload = {
    timestamp: cleanDate,
    visitor_id: body.visitor_id || "",
    siteId: body.siteId,
    page_url: body.page_url,
    referrer: body.referrer || "",
    event: body.event,
    path: body.path,
    country: cf?.country || "",
    city: cf?.city || "",
    user_agent: body.user_agent || "",
  };

  const tinybirdUrl = `${c.env.TINYBIRD_API_URL}/v0/events?name=events`;

  c.executionCtx.waitUntil(
    fetch(tinybirdUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${c.env.TINYBIRD_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(tinybirdPayload),
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          console.error(
            `[Ingest Error] Status: ${res.status} | Body: ${text.slice(0, 200)}`
          );
        }
      })
      .catch((err) => {
        console.error(
          `[Network Error] Failed to reach Tinybird: ${err.message}`
        );
      })
  );

  return c.text("ok");
});

export default app;
