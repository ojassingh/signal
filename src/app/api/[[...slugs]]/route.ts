import { Elysia } from "elysia";
import { authRoutes } from "../routes/auth";
import { ingestRoutes } from "../routes/ingest";

const app = new Elysia({ prefix: "/api" }).use(ingestRoutes).use(authRoutes);

export const GET = app.fetch;
export const POST = app.fetch;
export const PUT = app.fetch;
export const PATCH = app.fetch;
export const DELETE = app.fetch;
export const OPTIONS = app.fetch;
export const HEAD = app.fetch;
