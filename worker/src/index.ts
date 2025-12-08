import arcjet, { detectBot, fixedWindow } from "@arcjet/node";
import { Hono } from "hono";
import { cors } from "hono/cors";

type Env = {
  TINYBIRD_TOKEN: string;
  TINYBIRD_API_URL: string;
  ARCJET_KEY?: string;
};

type IngestPayload = {
  timestamp: string;
  visitor_id: string;
  siteId: string;
  page_url: string;
  referrer?: string;
  event: string;
  path: string;
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
  if (c.env.ARCJET_KEY) {
    const aj = arcjet({
      key: c.env.ARCJET_KEY,
      characteristics: ["ip.src"],
      rules: [
        fixedWindow({
          mode: "LIVE",
          window: "1m",
          max: 100,
        }),
        detectBot({
          mode: "LIVE",
          allow: [],
        }),
      ],
    });

    const headers: Record<string, string> = {};
    c.req.raw.headers.forEach((value, key) => {
      headers[key] = value;
    });
    const decision = await aj.protect({
      headers,
      method: c.req.method,
      url: c.req.url,
    });
    if (decision.isDenied()) {
      return c.text("Too many requests", 429);
    }
  }

  const body = await c.req.json<IngestPayload>();
  const cf = c.req.raw.cf as { country?: string; city?: string } | undefined;

  const tinybirdPayload = {
    timestamp: body.timestamp,
    visitor_id: body.visitor_id,
    siteId: body.siteId,
    page_url: body.page_url,
    referrer: body.referrer || "",
    event: body.event,
    path: body.path,
    country: cf?.country || "",
    city: cf?.city || "",
  };

  await fetch(
    `${c.env.TINYBIRD_API_URL}/v0/events?name=events&token=${c.env.TINYBIRD_TOKEN}`,
    {
      method: "POST",
      body: JSON.stringify(tinybirdPayload),
    }
  );

  return c.text("ok");
});

export default app;
