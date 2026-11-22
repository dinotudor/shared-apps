import {
  and,
  asc,
  desc,
  eq,
  exists,
  ilike,
  inArray,
  isNull,
  notInArray,
  or,
  sql,
} from "drizzle-orm";
import type { Database } from "@shared-apps/db";
import { dish, ingredient } from "./schema.ts";
import { DishSort } from "./model.ts";
import type { Dish, DishChanges, DishQuery, DishSummary, NewDish } from "./model.ts";

export const insertDish = (db: Database, createdById: string, input: NewDish): Promise<string> =>
  db.transaction(async (tx) => {
    // One row in, one row back.
    const [row] = await tx
      .insert(dish)
      .values({ name: input.name, instructions: input.instructions, createdById })
      .returning({ id: dish.id });
    if (input.ingredients.length > 0) {
      await tx.insert(ingredient).values(
        input.ingredients.map(({ name, quantity }, position) => ({
          dishId: row.id,
          name,
          quantity,
          position,
        })),
      );
    }
    return row.id;
  });

/** The dish with its ingredients in order, deleted or not; null when there is no such dish. */
export const findDish = async (db: Database, id: string): Promise<Dish | null> => {
  const row = (await db.select().from(dish).where(eq(dish.id, id))).at(0);
  if (!row) return null;
  const ingredients = await db
    .select({ id: ingredient.id, name: ingredient.name, quantity: ingredient.quantity })
    .from(ingredient)
    .where(eq(ingredient.dishId, id))
    .orderBy(asc(ingredient.position));
  return { ...row, ingredients };
};

/** Marks a dish deleted. Returns false when there is no such dish, or it is deleted already. */
export const markDishDeleted = async (db: Database, id: string): Promise<boolean> => {
  const rows = await db
    .update(dish)
    // The database's clock, as for createdAt and updatedAt.
    .set({ deletedAt: sql`now()` })
    .where(and(eq(dish.id, id), isNull(dish.deletedAt)))
    .returning({ id: dish.id });
  return rows.length > 0;
};

/** `%` and `_` are wildcards in ILIKE, and a backslash escapes them: a search for "100%" means it. */
const containing = (text: string) => `%${text.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;

/** Dishes that aren't deleted, matching the search on their name or an ingredient's name. */
export const listDishes = (db: Database, { search, sort }: DishQuery): Promise<DishSummary[]> => {
  const pattern = search ? containing(search) : null;
  const matches = pattern
    ? or(
        ilike(dish.name, pattern),
        exists(
          db
            .select({ id: ingredient.id })
            .from(ingredient)
            .where(and(eq(ingredient.dishId, dish.id), ilike(ingredient.name, pattern))),
        ),
      )
    : undefined;
  return db
    .select({
      id: dish.id,
      name: dish.name,
      createdById: dish.createdById,
      createdAt: dish.createdAt,
      updatedAt: dish.updatedAt,
    })
    .from(dish)
    .where(and(isNull(dish.deletedAt), matches))
    .orderBy(
      ...(sort === DishSort.Recent
        ? [desc(dish.createdAt), asc(dish.id)]
        : // Times cooked (E3) and the average score (#22) don't exist yet, so every dish
          // ties on them. Those sorts will order by that value first, then by name.
          [asc(dish.name), asc(dish.id)]),
    );
};

export type UpdateResult = "updated" | "not-found" | "unknown-ingredient";

/**
 * Saves the dish's new name, instructions and ingredient list, all or nothing. Listed
 * ingredient ids are kept, unlisted ones deleted, and ones without an id added
 * (docs/adr/0007).
 */
export const updateDish = (db: Database, id: string, changes: DishChanges): Promise<UpdateResult> =>
  db.transaction(async (tx) => {
    // Locks the row, so a concurrent delete or edit waits for this one.
    const current = await tx
      .select({ id: dish.id })
      .from(dish)
      .where(and(eq(dish.id, id), isNull(dish.deletedAt)))
      .for("update");
    if (current.length === 0) return "not-found";

    const keptIds = changes.ingredients.flatMap((item) => (item.id ? [item.id] : []));
    if (keptIds.length > 0) {
      const owned = await tx
        .select({ id: ingredient.id })
        .from(ingredient)
        .where(and(eq(ingredient.dishId, id), inArray(ingredient.id, keptIds)));
      if (owned.length !== keptIds.length) return "unknown-ingredient";
    }

    await tx
      .update(dish)
      // The database's clock, as for createdAt, so the two always compare correctly.
      .set({ name: changes.name, instructions: changes.instructions, updatedAt: sql`now()` })
      .where(eq(dish.id, id));
    await tx
      .delete(ingredient)
      .where(
        keptIds.length > 0
          ? and(eq(ingredient.dishId, id), notInArray(ingredient.id, keptIds))
          : eq(ingredient.dishId, id),
      );
    for (const [position, { id: ingredientId, name, quantity }] of changes.ingredients.entries()) {
      if (ingredientId) {
        await tx
          .update(ingredient)
          .set({ name, quantity, position })
          .where(eq(ingredient.id, ingredientId));
      } else {
        await tx.insert(ingredient).values({ dishId: id, name, quantity, position });
      }
    }
    return "updated";
  });
