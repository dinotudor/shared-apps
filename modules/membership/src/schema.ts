import { pgSchema, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "@shared-apps/auth/schema";

// Exported so drizzle-kit writes CREATE SCHEMA (docs/adr/0002).
export const membership = pgSchema("membership");

/** Who may use each app (GLOSSARY: Member). */
export const appMember = membership.table(
  "app_member",
  {
    // An `App` value from @shared-apps/api-core.
    appId: text("app_id").notNull(),
    // Deleting an account ends its memberships, so no row points at nobody.
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.appId, table.userId] })],
);
