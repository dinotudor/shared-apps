// The dish types and values shared by the service, the repository and the router.

export type Ingredient = { id: string; name: string; quantity: string | null };

/** GLOSSARY: Dish. `deletedAt` is set on a Deleted dish. */
export type Dish = {
  id: string;
  name: string;
  instructions: string;
  ingredients: Ingredient[];
  /** Null once the creator's account is deleted. */
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

/** A dish in a list: enough for its card, without ingredients. */
export type DishSummary = Pick<Dish, "id" | "name" | "createdById" | "createdAt" | "updatedAt">;

export const DishSort = {
  /** Newest first. */
  Recent: "recent",
  /** Highest Times cooked first. */
  MostCooked: "mostCooked",
  /** Highest average score first (#22). */
  BestScore: "bestScore",
} as const;
export type DishSort = (typeof DishSort)[keyof typeof DishSort];

export type DishQuery = {
  /** Part of the dish's name or of one of its ingredients' names, in any case. */
  search?: string;
  sort: DishSort;
};

export type NewIngredient = { name: string; quantity: string | null };

/** Valid input: the router has trimmed and checked it. */
export type NewDish = { name: string; instructions: string; ingredients: NewIngredient[] };

/** An ingredient in an edit: with the `id` of one the dish has, to keep it (docs/adr/0007). */
export type IngredientChange = NewIngredient & { id?: string | undefined };

/** Valid input, as for NewDish. Ingredient ids are distinct. */
export type DishChanges = { name: string; instructions: string; ingredients: IngredientChange[] };
