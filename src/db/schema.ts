import {
    pgTable,
    text,
    uuid,
    timestamp,
  } from "drizzle-orm/pg-core";
  
  export const users = pgTable("users", {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    createdAt: timestamp("created_at", {
      mode: "date",
      withTimezone: true,
    }).notNull().defaultNow(),
  });
  
  export const sites = pgTable("sites", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    domain: text("domain").notNull(),
    createdAt: timestamp("created_at", {
      mode: "date",
      withTimezone: true,
    }).notNull().defaultNow(),
  });
  