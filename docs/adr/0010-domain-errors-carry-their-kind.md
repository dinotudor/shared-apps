# 0010. Domain errors carry their kind, and api-core maps kinds

- Status: accepted
- Date: 2026-11-25
- Issue: #73
- Amends: ADR 0006, decision 5

## Context

Playbook ADR 0012 says that services throw errors extending `DomainError`, each with a stable `code`, and that one layer in `api-core` maps them to tRPC errors. ADR 0006 (decision 5) and PR #38 put that mapping in `packages/api-core/src/trpc.ts` as a table from each code to a tRPC code, with every code listed in one `DomainErrorCode` union in `api-core`. The compiler catches a code that has no status, but `api-core` has to know every module's errors. Each module that adds an error edits the shared package, and that list grows with `meals` and every later module.

## Decision

1. **Each `DomainError` subclass declares a `kind` next to its `code`.** The kinds are a fixed list in `api-core`: `not_found`, `rule_violated` and `forbidden`. `api-core` maps each kind to one tRPC code: NOT_FOUND, BAD_REQUEST and FORBIDDEN. `rule_violated` is a business rule the call broke, such as an unknown ingredient (ADR 0007), not malformed input: Zod rejects that before a service runs. The mapping is still the one place where domain errors become tRPC errors, as ADR 0012 asks. It lists kinds instead of codes.
2. **`code` is a string literal on each class, owned by the module that declares the error.** `api-core` no longer lists codes, and `DomainErrorCode` is removed. The frontends still branch on `error.data.domainCode`, which is unchanged.
3. **A new kind is added to `api-core` on purpose**, together with its tRPC code. That should be rare: the kind describes what went wrong for the caller, not the business rule. A new rule usually fits one of the three. `conflict` (CONFLICT), for a call that clashes with the current state, is left out until a module needs it. No planned module does: `meals.plan` replaces a day's meal (#27).
4. **Codes are unique across the repository by convention, not by a check.** They are snake_case and name what is involved (`dish_not_found`, never a bare `not_found`), so two modules are unlikely to choose the same one. A duplicate would only matter if one frontend call could receive both errors.

## Alternatives considered

- **Keep the central union and table** (PR #38). The compiler enforces a status for every code, but every module edits `api-core`, which is the cross-module hotspot this ADR removes.
- **Each module registers its codes with `api-core` at startup**, as a map from code to tRPC code. Modules stay out of `api-core`'s source, but the mapping is spread across every module and checked only at runtime. A module could also pick any tRPC code, including INTERNAL_SERVER_ERROR.
- **Each error declares its tRPC code directly.** It's the smallest change, but it puts tRPC, a transport concern, into module errors, which ADR 0012 keeps in `api-core`.
- **A test that lists every exported domain error and checks that codes are unique.** It would need a list of every module to import, which is the per-module edit #72 removes from `apps/api`. We can add it if a collision ever happens.

## Consequences

- Adding a domain error changes only the module that throws it.
- The compiler still rejects an error without a `kind`, and a kind without a tRPC code.
- The frontends see `domainCode` as `string | null`, not as a union of every code, because the router's type no longer knows the codes. A typo in a frontend comparison (`=== "dish_not_fund"`) is no longer a compile error. No frontend branches on `domainCode` yet. If that becomes a problem, each module can export a type with its codes for the frontend to `import type`.
