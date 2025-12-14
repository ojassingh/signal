import { Elysia } from "elysia";
import { registerChatRoutes } from "@/app/api/[[...slugs]]/routes/chat";
import { auth } from "@/lib/auth";

export const api = new Elysia().mount(auth.handler);

registerChatRoutes(api);
