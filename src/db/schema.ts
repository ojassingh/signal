import {
  pgTable,
  text,
  uuid,
  timestamp,
  primaryKey,
} from "drizzle-orm/pg-core";

const createdAt = timestamp("created_at", {
  mode: "date",
  withTimezone: true,
}).notNull().defaultNow();

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  createdAt,
});

export const sites = pgTable("sites", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  domain: text("domain").notNull(),
  createdAt,
});

// export const siteMembers = pgTable("site_members", {
//   siteId: uuid("site_id")
//     .notNull()
//     .references(() => sites.id, { onDelete: "cascade" }),
//   userId: text("user_id")
//     .notNull()
//     .references(() => users.id, { onDelete: "cascade" }),
//   createdAt,
// }, (table) => [
//   primaryKey({ columns: [table.siteId, table.userId] }),
// ]);
