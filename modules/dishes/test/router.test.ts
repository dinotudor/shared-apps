import { TRPCError } from "@trpc/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createCallerFactory, router } from "@shared-apps/api-core";
import type { Viewer } from "@shared-apps/auth";
import { createTestUser } from "@shared-apps/auth/testing";
import { startTestDatabase } from "@shared-apps/db/testing";
import type { TestDatabase } from "@shared-apps/db/testing";
import { createDishes, dishesRouter } from "../src/index.ts";
import type { Dishes } from "../src/index.ts";

let database: TestDatabase;
let dishes: Dishes;

/** Calls the procedures as `viewer`, who is a member of What's for dinner unless told otherwise. */
const callerFor = (viewer: Viewer | null, { member = true } = {}) =>
  createCallerFactory(router({ dishes: dishesRouter(dishes) }))({
    viewer,
    isMemberOf: () => Promise.resolve(viewer !== null && member),
  });

const ANA: Viewer = { id: "ana", name: "Ana Teste", role: "member" };

const errorOf = async (call: Promise<unknown>) => {
  const error: unknown = await call.catch((caught: unknown) => caught);
  if (!(error instanceof TRPCError)) throw new Error(`expected a TRPCError, got ${String(error)}`);
  return error;
};

beforeAll(async () => {
  database = await startTestDatabase();
  await createTestUser(database.db, { id: ANA.id, name: ANA.name, email: "ana@example.com" });
  dishes = createDishes(database.db);
});

afterAll(async () => {
  await database.stop();
});

const feijoada = {
  name: "Feijoada",
  instructions: "Soak the beans overnight.",
  ingredients: [{ name: "Black beans", quantity: "500 g" }],
};

describe("dishes procedures", () => {
  it("reject a call without a session as UNAUTHORIZED", async () => {
    expect((await errorOf(callerFor(null).dishes.list({}))).code).toBe("UNAUTHORIZED");
  });

  it("reject a signed-in collaborator who is not a member of What's for dinner as FORBIDDEN", async () => {
    const error = await errorOf(callerFor(ANA, { member: false }).dishes.create(feijoada));

    expect(error.code).toBe("FORBIDDEN");
  });

  it("record the viewer as the creator of a new dish", async () => {
    const ana = callerFor(ANA);

    const { id } = await ana.dishes.create(feijoada);

    expect(await ana.dishes.get({ id })).toMatchObject({ name: "Feijoada", createdById: "ana" });
  });

  it("trim text and store a blank quantity as none", async () => {
    const ana = callerFor(ANA);

    const { id } = await ana.dishes.create({
      name: "  Cuscuz  ",
      instructions: "  Steam it.  ",
      ingredients: [{ name: " Corn flour ", quantity: "  " }],
    });

    expect(await ana.dishes.get({ id })).toMatchObject({
      name: "Cuscuz",
      instructions: "Steam it.",
      ingredients: [{ name: "Corn flour", quantity: null }],
    });
  });

  it("reject a dish without a name as BAD_REQUEST", async () => {
    const error = await errorOf(callerFor(ANA).dishes.create({ ...feijoada, name: "   " }));

    expect(error.code).toBe("BAD_REQUEST");
  });

  it("reject an edit that lists the same ingredient twice as BAD_REQUEST", async () => {
    const ana = callerFor(ANA);
    const { id } = await ana.dishes.create(feijoada);
    const [beans] = (await ana.dishes.get({ id })).ingredients;
    const twice = { id: beans.id, name: "Black beans", quantity: null };

    const error = await errorOf(
      ana.dishes.update({ id, name: "Feijoada", instructions: "", ingredients: [twice, twice] }),
    );

    expect(error.code).toBe("BAD_REQUEST");
  });

  it("report an unknown dish as NOT_FOUND with the domain code dish_not_found", async () => {
    const error = await errorOf(
      callerFor(ANA).dishes.get({ id: "00000000-0000-4000-8000-000000000000" }),
    );

    expect(error.code).toBe("NOT_FOUND");
    expect(error.cause).toMatchObject({ code: "dish_not_found" });
  });

  it("hide a deleted dish from list and get, unless history is asked for", async () => {
    const ana = callerFor(ANA);
    const { id } = await ana.dishes.create({ ...feijoada, name: "Rabada" });

    await ana.dishes.delete({ id });

    expect((await ana.dishes.list({ search: "Rabada" })).map((dish) => dish.id)).toEqual([]);
    expect((await errorOf(ana.dishes.get({ id }))).code).toBe("NOT_FOUND");
    expect(await ana.dishes.get({ id, includeDeleted: true })).toMatchObject({ name: "Rabada" });
  });

  it("list every dish when called without input", async () => {
    const ana = callerFor(ANA);
    const { id } = await ana.dishes.create({ ...feijoada, name: "Baião de dois" });

    expect((await ana.dishes.list()).map((dish) => dish.id)).toContain(id);
  });

  it("list by most recent unless another sort is asked for", async () => {
    const ana = callerFor(ANA);
    await ana.dishes.create({ ...feijoada, name: "Tutu A" });
    await ana.dishes.create({ ...feijoada, name: "Tutu B" });

    const names = async (sort?: "mostCooked") =>
      (await ana.dishes.list({ search: "Tutu", ...(sort ? { sort } : {}) })).map((d) => d.name);

    expect(await names()).toEqual(["Tutu B", "Tutu A"]);
    expect(await names("mostCooked")).toEqual(["Tutu A", "Tutu B"]);
  });
});
