import { index, integer, pgSchema, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "@shared-apps/auth/schema";

// Exported so drizzle-kit writes CREATE SCHEMA (docs/adr/0002).
export const dishes = pgSchema("dishes");

/** GLOSSARY: Dish. A set `deleted_at` makes it a Deleted dish. */
export const dish = dishes.table("dish", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  instructions: text("instructions").notNull().default(""),
  // Null once the creator's account is deleted: the family keeps the dish.
  createdById: text("created_by_id").references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

/**
 * GLOSSARY: Ingredient. Keeps its id across edits of the dish (docs/adr/0007), because
 * missing ingredients on past meals will point at it.
 */
export const ingredient = dishes.table(
  "ingredient",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    dishId: uuid("dish_id")
      .notNull()
      .references(() => dish.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    // Free text ("2 cups", "a pinch"); null when not given.
    quantity: text("quantity"),
    // 0-based order in the dish. Not unique: an edit renumbers rows one at a time.
    position: integer("position").notNull(),
  },
  (table) => [index("ingredient_dish_id_idx").on(table.dishId)],
);
