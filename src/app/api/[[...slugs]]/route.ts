import { api } from "@/app/api/[[...slugs]]/api";

export const maxDuration = 30;

const handler = (req: Request) => api.fetch(req);

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
export const HEAD = handler;
