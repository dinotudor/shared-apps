import { DomainError } from "@shared-apps/api-core";

/** No dish has this id, or it is a Deleted dish and history wasn't asked for. */
export class DishNotFoundError extends DomainError {
  override name = "DishNotFoundError";
  readonly code = "dish_not_found";
}

/** An edit names an ingredient id that isn't one of the dish's ingredients (docs/adr/0007). */
export class UnknownIngredientError extends DomainError {
  override name = "UnknownIngredientError";
  readonly code = "unknown_ingredient";
}
