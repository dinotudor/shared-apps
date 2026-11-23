# 0007. Editing a dish keeps the identity of its ingredients

- Status: accepted
- Date: 2026-11-19
- Issue: #21

## Context

Issue #21 asks for `dishes.update` to "replace the ingredient list in order". The simplest way to do that deletes every ingredient row and inserts the new list. Each edit would then give every ingredient a new id.

E3 adds missing ingredients: a row per meal and ingredient that someone unchecked on the day (brief section 3.5). Brief decision D6 says that removing an ingredient from a dish deletes its missing-ingredient rows by cascade, so past meals stop showing it. With delete-and-insert, fixing a typo in a dish's instructions would delete the missing ingredients of every past meal of that dish, not just those of the ingredients that were removed.

## Decision

1. **An edit sends the whole ingredient list, in order, and each item may carry the `id` of an ingredient the dish already has.** Afterwards the dish has exactly that list:
   - an item with an id keeps that ingredient, with its new name, quantity and position;
   - an existing ingredient that isn't listed is deleted (and, from E3, its missing-ingredient rows with it, as D6 asks);
   - an item without an id is a new ingredient.
2. **An id that isn't one of this dish's ingredients is an error** (`unknown_ingredient`, BAD_REQUEST), and nothing is saved. The same id listed twice is rejected by input validation.
3. Positions are 0-based and rewritten from the list order on every edit. They aren't unique in the database: rows are renumbered one at a time inside the edit's transaction.

## Alternatives considered

- **Delete and insert the whole list.** Simplest, and a client never deals with ids. But every edit would cut past meals off from their missing ingredients, which breaks D6's intent.
- **Separate procedures per ingredient** (add, rename, move, remove). Keeps identity too, but the edit screen (#26) saves a whole form at once. It would need several calls that can fail halfway, or a transaction across calls.
- **Match ingredients by name.** No ids in the client, but renaming "Feijão" to "Feijão preto" would count as remove-and-add, and two ingredients can share a name.

## Consequences

- A client that sends no ids still gets "replace the list", so the simple behaviour remains available.
- The edit screen (#26) must keep each ingredient's id in its form state and send it back.
- Renaming an ingredient keeps its missing-ingredient rows on past meals. If the rename changes what the ingredient is, those rows now show the new name.
