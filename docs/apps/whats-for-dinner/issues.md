# What's for dinner — epics and issues (proposal)

> For `engineering-playbook/processes/plan-project.md`, steps 3–7. Status: approved by Dino (2026-11-08).
> Repository: `dinotudor/shared-apps`. GitHub Project: "What's for dinner". Every issue gets the label `app:whats-for-dinner`.
> The brief (`brief.md`) becomes the issue labelled `brief`. Visual reference for every screen issue: the prototype https://claude.ai/artifact/KHJ7ACQG7n5WvGSdjeXseP and brief section 10. Decision references (D1–D8) point to its section 8.
> Each issue fits in one PR and follows `processes/implement-issue.md`.

Suggested order: E1 → E2 → E3 → E4. E5 can run in parallel once Dino has the infrastructure.

---

## E1 — Foundation

### 1. Scaffold `apps/api` with a health route
- **Goal:** a running Fastify 5 API that hosts tRPC at `/trpc`, plus `packages/api-core` for shared pieces.
- **Acceptance:** `pnpm dev` starts the API; `GET /health` returns 200; tRPC `health.ping` returns `{ ok: true }`; config validated at startup (bad env fails fast, ADR 0012); typecheck, lint, test and build pass in CI.
- **Tests:** an integration test calls `/health` and `health.ping`.

### 2. Scaffold `apps/web` with Qwik 2
- **Goal:** a Qwik 2 app whose server code calls the API through the tRPC client.
- **Acceptance:** home page shows the API's health result; only server code calls the API; router types imported from the API, no runtime import.
- **Tests:** a route loader test with a mocked tRPC client.

### 3. Database setup with PostgreSQL and Drizzle
- **Goal:** local PostgreSQL, Drizzle config and a migration workflow every module uses.
- **Acceptance:** `docker compose up` starts Postgres; `pnpm db:migrate` applies migrations; tests run against a disposable database (ADR 0013); one schema per module.
- **Tests:** a migration test on an empty database.

### 4. Sign-in with Better Auth, Google and an allowlist
- **Goal:** Google sign-in with sessions in PostgreSQL and an email allowlist (ADR 0008).
- **Acceptance:** allowlisted users sign in, others are refused; procedures are protected by default; the API verifies the session on each call; sign-out works; a sign-in page exists in `apps/web`.
- **Tests:** allowed vs refused email; protected procedure without a session returns UNAUTHORIZED.
- **Needs from Dino:** a Google OAuth client for local development.

### 5. Per-app membership (`app_member`)
- **Goal:** only members of an app can use it (D8).
- **Acceptance:** `app_member` (appId, userId) table; a tRPC middleware rejects non-members of `whats-for-dinner` with FORBIDDEN; a seed or CLI script adds members by email.
- **Tests:** member allowed, signed-in non-member forbidden.

### 6. Background jobs with pg-boss
- **Goal:** pg-boss running inside the API (ADR 0009).
- **Acceptance:** pg-boss starts and stops with the API; a scheduled heartbeat job logs once a minute; failed jobs are logged.
- **Tests:** a job is enqueued and processed in an integration test.

### 7. Design system package
- **Goal:** `packages/design-system` with the tokens, icons and base components from the design project.
- **Acceptance:** `tokens-wfd.css` (palette B, light and dark via `prefers-color-scheme` and `data-theme`) and the SkiroLiro base (Figtree, JetBrains Mono, spacing, radius) exported as CSS custom properties and TypeScript; the icon sprite and `icons/*.svg` available as an `<Icon name>` component; logo files from `brand/` (light and dark); base components: Button (primary, secondary, text, danger), Card, Chip, Checkbox, TextField, TextArea, BottomNav, Avatar, Alert (warning, info, success), Toast, BottomSheet, Dialog; a demo route in `apps/web` shows them in light and dark. Follows brief section 10.
- **Tests:** component render tests for each variant.

### 8. App shell and navigation
- **Goal:** the mobile layout every screen uses.
- **Acceptance:** header with logo and user avatar; bottom navigation (Week, Dishes); signed-out users go to sign-in; shared empty, loading and error / offline states (offline shows cached data read-only with the brief's copy); favicon and app icon from the logo; works at 360–430 px wide.
- **Tests:** navigation renders and marks the active tab.

### 9. i18n setup *(blocked: playbook ADR 0015 (i18n, proposed))*
- **Goal:** UI strings in pt-BR with English keys, following the ADR.
- **Acceptance:** all strings from issues 7–8 come from translation files; date formatting uses pt-BR and the family time zone (D1).
- **Tests:** a missing key fails the build or a test.

---

## E2 — Dishes

### 10. `modules/dishes`: schema and CRUD
- **Goal:** Dish and DishIngredient with create, read, update and soft delete.
- **Acceptance:** tRPC `dishes.list` (search by name or ingredient, sort by most cooked / best score / recent), `dishes.get`, `dishes.create`, `dishes.update` (replaces the ingredient list in order), `dishes.delete` (sets `deletedAt`); deleted dishes are hidden from list and get unless asked for history; `createdById` recorded.
- **Tests:** service tests for each operation, including search and soft delete. Sorting by "most cooked" can return 0 until E3 exists.

### 11. Ratings and "fed up"
- **Goal:** one 0–10 score per user and dish, plus the fed-up toggle (D4).
- **Acceptance:** `dishes.rate` upserts the score; `dishes.setFedUp` sets `fedUpUntil = today + 21 days` in the family time zone or clears it; list and get return my score, family average (unrated users ignored) and fed-up users with an active date.
- **Tests:** average math, fed-up expiry at the date boundary.

### 12. Dish photos in object storage
- **Goal:** upload, resize and serve dish photos (D2).
- **Acceptance:** upload up to 5 MB (JPEG, PNG, WebP, HEIC); resized to web size and stored in S3-compatible storage; `photoKey` saved on the dish; replacing a photo deletes the old object; local development uses a local S3-compatible service.
- **Tests:** size and type limits; replace deletes the old object.
- **Needs from Dino:** bucket and credentials for production (local works without).

### 13. Screen: Dishes list
- **Goal:** wireframe 4.
- **Acceptance:** search, three sort chips, cards with photo, times cooked, family average with emoji, my score, fed-up note; "New dish" button; empty state.
- **Tests:** loader and render tests.

### 14. Screen: Dish detail and my rating
- **Goal:** wireframe 5.
- **Acceptance:** photo, name, author, times cooked; 0–10 selector with emoji mapping (🤢 0–4, 😐 5–7, 😍 8–10); fed-up toggle with end date; family scores; ingredients; instructions; Edit link.
- **Tests:** rating updates optimistically and persists.

### 15. Screen: New / edit dish
- **Goal:** wireframe 6.
- **Acceptance:** photo picker, name, ingredient rows (add, remove, reorder), instructions; validation messages; save; delete with the guide's confirmation copy.
- **Tests:** create, edit and delete flows.

---

## E3 — Meals

### 16. `modules/meals`: plan a day and query a week
- **Goal:** Meal with kind dish / skip / freestyle (one per date).
- **Acceptance:** `meals.plan(date, kind, dishId?)` upserts and records `plannedById`; `meals.week(startDate)` returns 7 days with plan, response summary, missing count and vote notices; times cooked exposed to `dishes` through `meals`' public interface; past days stay editable (D3).
- **Tests:** one meal per date; dishId required only for kind dish; week boundaries in the family time zone.

### 17. Responses, reactions and missing ingredients
- **Goal:** the interactive parts of the day page.
- **Acceptance:** `meals.respond` (cant_wait / lets_order / going_out / not_home, one per user, changeable, sending the same one clears it); `meals.react` toggles any emoji per user and the week summary returns the most popular one; `meals.volunteer` sets or clears `errandUserId` ("I'll go"); `meals.setIngredientMissing` toggles a MissingIngredient; removing an ingredient from a dish cascades (D6); `meals.day(date)` returns everything the day page needs.
- **Tests:** vote notice text counts; reaction toggle; cascade on ingredient removal.

### 18. Screen: Week
- **Goal:** wireframe 1, the home screen.
- **Acceptance:** Monday–Sunday cards, today highlighted, previous / next week; each card shows plan type icon, summary, missing-ingredient badge and the most popular reaction; empty days link to Plan; empty-week copy from the guide; after planning, a toast confirms ("Planejado: …").
- **Tests:** render with a mix of dish, skip, freestyle and empty days.

### 19. Screen: Plan a day
- **Goal:** wireframe 3.
- **Acceptance:** Skip dinner and Free-style options; searchable dish list with average, times cooked, last cooked and fed-up flags; choosing returns to the day.
- **Tests:** each choice saves the right kind.

### 20. Screen: Day
- **Goal:** wireframe 2.
- **Acceptance:** dish photo and details, who planned it, who is fed up, "Change plan" link; ingredient checklist (all checked by default) with the missing-ingredient alert and the "Eu vou" button (turns into a green confirmation with Undo); four responses with counts and the list of people; order / going-out notice; emoji reactions; skip and freestyle variants.
- **Tests:** unchecking shows the alert; responses and reactions update.

---

## E4 — Release to the family

### 21. Seed and first-run experience
- **Goal:** the family opens a useful app on day one.
- **Acceptance:** a script adds family members (issue 5) and optional starter dishes; empty states guide the first dish and the first plan.
- **Tests:** seed is idempotent.

### 22. Mobile polish and accessibility pass
- **Goal:** ready for daily use on phones.
- **Acceptance:** touch targets ≥ 44 px; text contrast ≥ 4.5:1; keyboard and screen-reader labels on icon buttons; works on iOS Safari and Android Chrome; add-to-home-screen icon and name.
- **Tests:** automated a11y check on each screen.

---

## E5 — Deploy *(blocked: ADR 0014 and Dino's infrastructure)*

### 23. Container images and production config
- **Goal:** Dockerfiles for `apps/api` and `apps/web` with Node pinned like `devEngines` (ADR 0002).
- **Acceptance:** images build in CI and run locally with production config.

### 24. Deploy pipeline
- **Goal:** push to `main` deploys (per the accepted hosting ADR).
- **Acceptance:** CI deploys both apps; HTTPS on a subdomain; secrets from GitHub Actions; a pg-boss job survives a redeploy; migrations run before the new version serves traffic.
- **Needs from Dino:** VPS, domain, production OAuth client.

### 25. Backups and restore runbook
- **Goal:** nightly database backup outside the server.
- **Acceptance:** nightly `pg_dump` to object storage with retention; a documented restore was tested once.
- **Needs from Dino:** backup bucket.
