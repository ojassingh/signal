import { geolocation } from "@vercel/functions";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  console.log("Ingest route triggered");
  const body = await req.json();
  const { country, city } = geolocation(req);

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

  return new NextResponse("ok");
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
