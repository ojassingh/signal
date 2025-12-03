import type { sites } from "@/db/schema";

export type ActionSuccess<T> = {
  success: true;
  data: T;
};

export type ActionError = {
  success: false;
  error: string;
};

export type ActionResult<T> = ActionSuccess<T> | ActionError;

export type Site = typeof sites.$inferSelect;
export type NewSite = typeof sites.$inferInsert;
