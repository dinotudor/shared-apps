import type { Dishes } from "@shared-apps/dishes";

const unused = () => Promise.reject(new Error("this test does not use the dishes module"));

/** For tests that build the app but never call a dishes procedure. */
export const unusedDishes: Dishes = {
  list: unused,
  get: unused,
  create: unused,
  update: unused,
  delete: unused,
};
