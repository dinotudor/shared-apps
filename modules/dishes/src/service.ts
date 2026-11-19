import type { Database } from "@shared-apps/db";
import { DishNotFoundError, UnknownIngredientError } from "./errors.ts";
import type { Dish, DishChanges, DishQuery, DishSummary, NewDish } from "./model.ts";
import { findDish, insertDish, listDishes, markDishDeleted, updateDish } from "./repository.ts";

export type Dishes = {
  /** Every dish that isn't deleted and matches the search, in the order asked for. */
  list: (query: DishQuery) => Promise<DishSummary[]>;
  /** Records a new dish, created by `createdById`. Ingredients keep the order given. */
  create: (createdById: string, input: NewDish) => Promise<{ id: string }>;
  /**
   * The dish with its ingredients in order. A Deleted dish is returned only with
   * `includeDeleted` (history, such as a past meal); otherwise it is DishNotFoundError.
   */
  get: (id: string, options?: { includeDeleted?: boolean }) => Promise<Dish>;
  /**
   * Replaces the dish's name, instructions and ingredient list. The stored list becomes
   * exactly `changes.ingredients`, in order. Throws DishNotFoundError for a deleted or
   * unknown dish, and UnknownIngredientError (changing nothing) for an ingredient id the
   * dish doesn't have.
   */
  update: (id: string, changes: DishChanges) => Promise<void>;
  /**
   * Makes it a Deleted dish: hidden from lists and pickers, kept for history. Throws
   * DishNotFoundError when it is deleted already, like every other operation on it.
   */
  delete: (id: string) => Promise<void>;
};

export const createDishes = (db: Database): Dishes => ({
  list: (query) => listDishes(db, query),
  create: async (createdById, input) => ({ id: await insertDish(db, createdById, input) }),
  get: async (id, { includeDeleted = false } = {}) => {
    const found = await findDish(db, id);
    if (!found || (found.deletedAt && !includeDeleted)) throw new DishNotFoundError();
    return found;
  },
  update: async (id, changes) => {
    const result = await updateDish(db, id, changes);
    if (result === "not-found") throw new DishNotFoundError();
    if (result === "unknown-ingredient") throw new UnknownIngredientError();
  },
  delete: async (id) => {
    if (!(await markDishDeleted(db, id))) throw new DishNotFoundError();
  },
});
