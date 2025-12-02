import { type NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const event = await req.json();
  const ip =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";

  console.log("📥 Ingesting event:", {
    type: event,
    ip,
  });

  //   await fetch(
  //     `https://api.tinybird.co/v0/events?name=events&token=${process.env.TINYBIRD_TOKEN}`,
  //     {
  //       method: 'POST',
  //       body: JSON.stringify({ ...event, ip })
  //     }
  //   );

  return new NextResponse("ok", {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
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
