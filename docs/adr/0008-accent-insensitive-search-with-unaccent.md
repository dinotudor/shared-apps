# 0008. Accent-insensitive search with unaccent

- Status: accepted
- Date: 2026-11-22
- Issue: #21

## Context

Dish and ingredient names are written in Portuguese, but people often type searches without accents, especially on a phone. `ILIKE` ignores case but not accents, so a search for "feijao" didn't find "Feijão".

## Decision

1. Migration 0003 enables PostgreSQL's `unaccent` extension in the `public` schema. Extensions belong to the whole database, not to one module, so they don't go in a module's schema (ADR 0002).
2. Searches compare `public.unaccent(column) ILIKE public.unaccent(pattern)`. Both sides are unaccented, so an accent typed in the search doesn't hide a dish written without one. The calls are schema-qualified, so they don't depend on the connection's `search_path`.
3. No index for now. `unaccent` isn't `IMMUTABLE`, so an index on it needs an immutable wrapper function. With a few hundred dishes, a sequential scan is fast enough.

## Consequences

- Any PostgreSQL the app runs on must offer `unaccent`. It ships with PostgreSQL's contrib modules, which the official images and the common managed hosts include. It is a trusted extension (PostgreSQL 13+), so the database owner can create it without superuser.
- Other modules can use `public.unaccent` in their own searches.
- If the dish list ever needs an index, add an immutable wrapper and a trigram or expression index, in a new ADR.
