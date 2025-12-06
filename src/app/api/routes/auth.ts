import { toNextJsHandler } from "better-auth/next-js";
import { Elysia } from "elysia";
import { auth } from "@/lib/auth";

const authHandlers = toNextJsHandler(auth);

export const authRoutes = new Elysia().all("/auth/*", ({ request }) => {
  if (request.method === "GET") {
    return authHandlers.GET(request);
  }
  if (request.method === "POST") {
    return authHandlers.POST(request);
  }
  return new Response("Method not allowed", { status: 405 });
});
