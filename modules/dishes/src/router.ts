import { z } from "zod";
import { App, memberProcedure, router } from "@shared-apps/api-core";
import { DishSort } from "./model.ts";
import type { Dishes } from "./service.ts";

const NAME_MAX = 120;
const QUANTITY_MAX = 60;
const INSTRUCTIONS_MAX = 10_000;

const name = z.string().trim().min(1).max(NAME_MAX);
// Free text such as "2 cups"; blank means none was given.
const quantity = z
  .string()
  .trim()
  .max(QUANTITY_MAX)
  .nullish()
  .transform((value) => value || null);
const instructions = z.string().trim().max(INSTRUCTIONS_MAX).default("");
const id = z.uuid();

const newDishInput = z.object({
  name,
  instructions,
  ingredients: z.array(z.object({ name, quantity })),
});

const dishChangesInput = z.object({
  id,
  name,
  instructions,
  ingredients: z.array(z.object({ id: id.optional(), name, quantity })).refine(
    (items) => {
      const ids = items.flatMap((item) => (item.id ? [item.id] : []));
      return new Set(ids).size === ids.length;
    },
    { error: "an ingredient can be listed only once" },
  ),
});

const listInput = z
  .object({
    search: z
      .string()
      .trim()
      .max(NAME_MAX)
      .optional()
      .transform((value) => value || undefined),
    sort: z.enum(Object.values(DishSort)).default(DishSort.Recent),
  })
  // No input at all lists every dish, newest first.
  .prefault({});

// Every procedure is for members of What's for dinner (docs/adr/0006).
const procedure = memberProcedure(App.WhatsForDinner);

/** tRPC only: parse the input, call the service, return its result. */
export const dishesRouter = (dishes: Dishes) =>
  router({
    list: procedure.input(listInput).query(({ input }) => dishes.list(input)),
    get: procedure
      .input(z.object({ id, includeDeleted: z.boolean().default(false) }))
      .query(({ input }) => dishes.get(input.id, { includeDeleted: input.includeDeleted })),
    create: procedure
      .input(newDishInput)
      .mutation(({ ctx, input }) => dishes.create(ctx.viewer.id, input)),
    update: procedure
      .input(dishChangesInput)
      .mutation(({ input: { id: dishId, ...changes } }) => dishes.update(dishId, changes)),
    delete: procedure.input(z.object({ id })).mutation(({ input }) => dishes.delete(input.id)),
  });
