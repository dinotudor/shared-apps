import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestUser, deleteTestUser } from "@shared-apps/auth/testing";
import { startTestDatabase } from "@shared-apps/db/testing";
import type { TestDatabase } from "@shared-apps/db/testing";
import { createDishes, DishNotFoundError, DishSort, UnknownIngredientError } from "../src/index.ts";
import type { Dishes } from "../src/index.ts";

let database: TestDatabase;
let dishes: Dishes;
let ana: string;

beforeAll(async () => {
  database = await startTestDatabase();
  dishes = createDishes(database.db);
  ana = await createTestUser(database.db, {
    id: "ana",
    name: "Ana Teste",
    email: "ana@example.com",
  });
});

afterAll(async () => {
  await database.stop();
});

/** A dish with just a name and the given ingredient names, created by Ana. */
const saved = async (name: string, ingredientNames: string[] = []) =>
  (
    await dishes.create(ana, {
      name,
      instructions: "",
      ingredients: ingredientNames.map((ingredientName) => ({
        name: ingredientName,
        quantity: null,
      })),
    })
  ).id;

const UNKNOWN_ID = "00000000-0000-4000-8000-000000000000";

describe("creating a dish", () => {
  it("stores the dish with its ingredients in the order given, and who created it", async () => {
    const { id } = await dishes.create(ana, {
      name: "Feijoada",
      instructions: "Soak the beans overnight.",
      ingredients: [
        { name: "Black beans", quantity: "500 g" },
        { name: "Pork sausage", quantity: null },
        { name: "Bay leaves", quantity: "2" },
      ],
    });

    const dish = await dishes.get(id);

    expect(dish).toMatchObject({
      id,
      name: "Feijoada",
      instructions: "Soak the beans overnight.",
      createdById: ana,
      deletedAt: null,
      ingredients: [
        { name: "Black beans", quantity: "500 g" },
        { name: "Pork sausage", quantity: null },
        { name: "Bay leaves", quantity: "2" },
      ],
    });
  });
});

describe("reading a dish", () => {
  it("fails with DishNotFoundError when no dish has the id", async () => {
    await expect(dishes.get(UNKNOWN_ID)).rejects.toBeInstanceOf(DishNotFoundError);
  });

  it("keeps the dish when its creator's account is deleted, with no creator", async () => {
    const bruno = await createTestUser(database.db, {
      id: "bruno",
      name: "Bruno Teste",
      email: "bruno@example.com",
    });
    const { id } = await dishes.create(bruno, {
      name: "Moqueca",
      instructions: "",
      ingredients: [],
    });

    await deleteTestUser(database.db, bruno);

    expect(await dishes.get(id)).toMatchObject({ name: "Moqueca", createdById: null });
  });
});

describe("deleting a dish", () => {
  it("hides it from get", async () => {
    const id = await saved("Lasanha");

    await dishes.delete(id);

    await expect(dishes.get(id)).rejects.toBeInstanceOf(DishNotFoundError);
  });

  it("still returns it, marked as deleted, when history is asked for", async () => {
    const id = await saved("Strogonoff", ["Chicken"]);

    await dishes.delete(id);

    const dish = await dishes.get(id, { includeDeleted: true });
    expect(dish.name).toBe("Strogonoff");
    expect(dish.deletedAt).toBeInstanceOf(Date);
    expect(dish.ingredients).toMatchObject([{ name: "Chicken" }]);
  });

  it("fails with DishNotFoundError for a dish that is already deleted", async () => {
    const id = await saved("Escondidinho");
    await dishes.delete(id);

    await expect(dishes.delete(id)).rejects.toBeInstanceOf(DishNotFoundError);
  });

  it("fails with DishNotFoundError when no dish has the id", async () => {
    await expect(dishes.delete(UNKNOWN_ID)).rejects.toBeInstanceOf(DishNotFoundError);
  });
});

describe("listing dishes", () => {
  // Its own database, so dishes saved by other tests don't show up in these lists.
  let listDatabase: TestDatabase;
  let list: Dishes;

  const namesOf = async (query: Parameters<Dishes["list"]>[0]) =>
    (await list.list(query)).map((dish) => dish.name);

  beforeAll(async () => {
    listDatabase = await startTestDatabase();
    list = createDishes(listDatabase.db);
    const carla = await createTestUser(listDatabase.db, {
      id: "carla",
      name: "Carla Teste",
      email: "carla@example.com",
    });
    const add = (name: string, ingredientNames: string[]) =>
      list.create(carla, {
        name,
        instructions: "",
        ingredients: ingredientNames.map((ingredientName) => ({
          name: ingredientName,
          quantity: null,
        })),
      });
    // Created in this order, so "recent" lists them the other way round.
    await add("Pão de queijo", ["Cheese", "Tapioca flour"]);
    await add("Feijoada", ["Feijão preto", "Pork sausage"]);
    await add("Bolo 100% cenoura", ["Carrot", "Sugar"]);
    // Two ingredients match "chee", and the dish is still listed once.
    await add("Arroz de forno", ["Rice", "Cheese", "Grated cheese"]);
    const deleted = await add("Sopa de queijo", ["Cheese"]);
    await list.delete(deleted.id);
  });

  afterAll(async () => {
    await listDatabase.stop();
  });

  it("lists the newest dishes first, leaving out deleted ones", async () => {
    expect(await namesOf({ sort: DishSort.Recent })).toEqual([
      "Arroz de forno",
      "Bolo 100% cenoura",
      "Feijoada",
      "Pão de queijo",
    ]);
  });

  it("lists by name while no dish has been cooked or rated yet", async () => {
    const expected = ["Arroz de forno", "Bolo 100% cenoura", "Feijoada", "Pão de queijo"];

    expect(await namesOf({ sort: DishSort.MostCooked })).toEqual(expected);
    expect(await namesOf({ sort: DishSort.BestScore })).toEqual(expected);
  });

  it("finds dishes by part of their name, ignoring case", async () => {
    expect(await namesOf({ sort: DishSort.Recent, search: "FEIJ" })).toEqual(["Feijoada"]);
  });

  it("finds dishes by one of their ingredients, once each", async () => {
    expect(await namesOf({ sort: DishSort.Recent, search: "chee" })).toEqual([
      "Arroz de forno",
      "Pão de queijo",
    ]);
  });

  it("finds dishes ignoring accents, in the search or in the dish", async () => {
    expect(await namesOf({ sort: DishSort.Recent, search: "pao" })).toEqual(["Pão de queijo"]);
    expect(await namesOf({ sort: DishSort.Recent, search: "Bolo 100% cenôura" })).toEqual([
      "Bolo 100% cenoura",
    ]);
    // Through an ingredient: Feijoada has "Feijão preto".
    expect(await namesOf({ sort: DishSort.Recent, search: "FEIJAO" })).toEqual(["Feijoada"]);
  });

  it("treats % and _ in the search as plain characters", async () => {
    expect(await namesOf({ sort: DishSort.Recent, search: "100%" })).toEqual(["Bolo 100% cenoura"]);
    expect(await namesOf({ sort: DishSort.Recent, search: "_" })).toEqual([]);
  });

  it("returns a summary of each dish, without its ingredients", async () => {
    const [first] = await list.list({ sort: DishSort.Recent, search: "Arroz" });

    expect(first).toEqual({
      id: expect.any(String) as string,
      name: "Arroz de forno",
      createdById: "carla",
      createdAt: expect.any(Date) as Date,
      updatedAt: expect.any(Date) as Date,
    });
  });
});

describe("updating a dish", () => {
  it("changes its name and instructions, and records when", async () => {
    const id = await saved("Bobó");
    const before = await dishes.get(id);

    await dishes.update(id, {
      name: "Bobó de camarão",
      instructions: "Blend the cassava.",
      ingredients: [],
    });

    const after = await dishes.get(id);
    expect(after).toMatchObject({ name: "Bobó de camarão", instructions: "Blend the cassava." });
    expect(after.updatedAt.getTime()).toBeGreaterThan(before.updatedAt.getTime());
    expect(after.createdAt).toEqual(before.createdAt);
  });

  it("replaces the ingredient list with the one given, in its order", async () => {
    const id = await saved("Salpicão", ["Chicken", "Raisins", "Carrot"]);
    const [chicken, raisins] = (await dishes.get(id)).ingredients;

    await dishes.update(id, {
      name: "Salpicão",
      instructions: "",
      ingredients: [
        { id: raisins.id, name: "Golden raisins", quantity: "1 cup" },
        { name: "Mayonnaise", quantity: null },
        { id: chicken.id, name: "Chicken", quantity: null },
      ],
    });

    expect((await dishes.get(id)).ingredients).toEqual([
      { id: raisins.id, name: "Golden raisins", quantity: "1 cup" },
      { id: expect.any(String) as string, name: "Mayonnaise", quantity: null },
      { id: chicken.id, name: "Chicken", quantity: null },
    ]);
  });

  it("gives ingredients listed without an id new ids", async () => {
    const id = await saved("Farofa", ["Cassava flour"]);
    const [flour] = (await dishes.get(id)).ingredients;

    await dishes.update(id, {
      name: "Farofa",
      instructions: "",
      ingredients: [{ name: "Cassava flour", quantity: null }],
    });

    const [after] = (await dishes.get(id)).ingredients;
    expect(after.name).toBe("Cassava flour");
    expect(after.id).not.toBe(flour.id);
  });

  it("fails with UnknownIngredientError for an ingredient id of another dish, changing nothing", async () => {
    const other = await saved("Vatapá", ["Bread"]);
    const [bread] = (await dishes.get(other)).ingredients;
    const id = await saved("Acarajé", ["Black-eyed peas"]);

    await expect(
      dishes.update(id, {
        name: "Acarajé com vatapá",
        instructions: "",
        ingredients: [{ id: bread.id, name: "Bread", quantity: null }],
      }),
    ).rejects.toBeInstanceOf(UnknownIngredientError);
    expect(await dishes.get(id)).toMatchObject({
      name: "Acarajé",
      ingredients: [{ name: "Black-eyed peas" }],
    });
    expect((await dishes.get(other)).ingredients).toEqual([bread]);
  });

  it("fails with DishNotFoundError for a deleted dish", async () => {
    const id = await saved("Quindim");
    await dishes.delete(id);

    await expect(
      dishes.update(id, { name: "Quindim", instructions: "", ingredients: [] }),
    ).rejects.toBeInstanceOf(DishNotFoundError);
  });

  it("fails with DishNotFoundError when no dish has the id", async () => {
    await expect(
      dishes.update(UNKNOWN_ID, { name: "Cocada", instructions: "", ingredients: [] }),
    ).rejects.toBeInstanceOf(DishNotFoundError);
  });
});
