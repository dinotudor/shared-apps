# Brief — What's for dinner

> Status: approved by Dino (2026-11-08). Source of truth for planning and implementation in `shared-apps`.
> Wireframes (all 6 screens plus states): [light](design/screenshots/wireframes-claro.png) · [dark](design/screenshots/wireframes-escuro.png) · [icons](design/screenshots/icones.png)
> Visual design (final, clickable prototype + guide, works offline): [`design/wireframes-finais.html`](design/wireframes-finais.html)
> Logo: [`design/brand/`](design/brand/) · Brand identity (SkiroLiro): [`dinotudor/design-system`](https://github.com/dinotudor/design-system)
> Design files (tokens-wfd.css, icons/, brand/, PLANO.md, GUIA.md): see section 11.

## 1. Goal

A playful, mobile-first web app for one family. Family members save dishes, plan dinners for the week and react to tonight's dinner. Fun comes first; utility is a bonus.

It is also the first app in `shared-apps`. It must prove the shared stack end to end: sign-in, database, design system, monorepo layout, background jobs and deployment.

**Success:** the family uses it for at least two weeks without any external notifications.

## 2. Users

- 3–6 family members, all with Google accounts.
- Everyone can do everything. There are no app-level roles. We record who created a dish and who planned a day.
- Sign-in: Better Auth with Google and an email allowlist (playbook ADR 0008).

## 3. Scope — MVP

### 3.1 Dishes
- Create, edit and delete a dish: name, photo (optional), ingredients (ordered list of name + free-text quantity), instructions (free text).
- Delete is a soft delete. The dish disappears from lists and pickers, but past meals still show it.
- Dish list: search by name or ingredient; sort by most cooked, best score, most recent. Each card shows times cooked, family average, my score and who is fed up.

### 3.2 Ratings
- Each user rates each dish from 0 to 10. One rating per user and dish; it can be changed.
- Display: 🤢 0–4, 😐 5–7, 😍 8–10.
- "Fed up" (*Enjoei*) is a separate toggle. It sets `fedUpUntil = today + 21 days` and clears itself after that date. A user can undo it. While active, the dish is flagged in Plan, Dishes and the Day page.
- Family average = mean of all scores for the dish. Unrated users are ignored.

### 3.3 Planning
- Each calendar day has at most one dinner (`Meal`).
- A meal is one of: a saved dish, **Skip dinner**, or **Free-style** ("whatever is in the fridge").
- Anyone can plan or change any day. We record who planned it last.
- Times cooked = number of meals of that dish with a date before today.

### 3.4 Views
- **Week** (default, Monday to Sunday): one card per day with what is planned, response summary and alerts. Empty days link to planning.
- **Day:** dish photo and details, who planned it, ingredient checklist, responses and emoji reactions.

### 3.5 Day page
- **Ingredient checklist:** all ingredients are assumed present. Unchecking one marks it missing and shows the alert "Ingredient missing! Who's going? 😄" with the list of missing items.
- **"I'll go" (*Eu vou*):** any user can volunteer to buy the missing items. The alert turns into a green confirmation naming the volunteer, with Undo.
- **Responses** (one per user per meal, can be changed):
  - `cant_wait` — "MMMM can't wait!"
  - `lets_order` — "F*#% it, let's order!"
  - `going_out` — "I'm in the mood for going out tonight ;)"
  - `not_home` — "Not home tonight" *(to confirm)*
- `lets_order` and `going_out` are votes. They show a notice on the day ("2 people want to order 🛵") but never change the plan.
- **Reactions:** any emoji on a meal. The picker shows the most used ones and also accepts any emoji from the phone keyboard. A user can add several different emojis; tapping one again removes it. The week card shows the day's most popular reaction.
- Tapping your current response again clears it.

### 3.6 Language
- UI in Brazilian Portuguese. Code, identifiers, routes, commits and translation keys in English.
- The i18n approach is decided in playbook ADR 0015 (i18n, proposed).

## 4. Out of scope (later phases)

- Month view.
- Text messages between users.
- Statistics and rankings.
- Shopping list.
- External notifications (WhatsApp, push, e-mail). Earlier research proposed a `MessagingChannel` interface.
- Phase 2: emoji stickers on dish photos, stored as a non-destructive layer (`DishPhotoSticker`: dishId, userId, emoji, x, y, scale, rotation).

## 5. Domain model (draft)

| Entity | Fields | Rules |
| --- | --- | --- |
| User | id, name, email, avatarEmoji | Owned by Better Auth; avatarEmoji is ours |
| Dish | id, name, instructions, photoKey, createdById, createdAt, updatedAt, deletedAt | Soft delete |
| DishIngredient | id, dishId, name, quantity, position | Ordered |
| DishRating | dishId, userId, score (0–10), fedUpUntil, updatedAt | PK (dishId, userId) |
| Meal | id, date (unique), kind (`dish` / `skip` / `freestyle`), dishId, plannedById, errandUserId, updatedAt | dishId required only when kind = dish. errandUserId = who said "I'll go" |
| MissingIngredient | mealId, dishIngredientId, markedById | Only missing items are stored |
| MealResponse | mealId, userId, response, updatedAt | PK (mealId, userId) |
| MealReaction | mealId, userId, emoji | PK (mealId, userId, emoji) |

Derived, not stored: times cooked, family average, fed-up users, vote notices.

## 6. Screens (see wireframes)

1. Week — `/` 
2. Day — `/day/:date`
3. Plan a day — `/day/:date/plan`
4. Dishes — `/dishes`
5. Dish + my rating — `/dishes/:id`
6. New / edit dish — `/dishes/new`, `/dishes/:id/edit`

## 7. Technical context

Follows `engineering-playbook` (accepted ADRs 0001–0013):

- pnpm workspace monorepo; Node pinned with `devEngines`; TypeScript run natively.
- `apps/web`: Qwik 2. Calls the API only from server code. No business logic.
- `apps/api`: Fastify 5 + tRPC, a modular monolith built from `modules/*` (router, service, repository each).
- PostgreSQL + Drizzle. Better Auth sessions in PostgreSQL. pg-boss inside the API for jobs.
- Proposed: hosting on one VPS with Kamal 2 (playbook ADR 0014, not yet accepted).

Expected new packages: `modules/dishes`, `modules/meals` (names to confirm), `packages/design-system` (tokens and icons from the design project).

## 8. Decisions from the grilling

- **D1 — Today:** one fixed family time zone, `America/Sao_Paulo`, configured by env var. All "today" and "past" logic uses it.
- **D2 — Photos:** stored in S3-compatible object storage (same provider as backups). Max 5 MB upload; resized on upload to a web-friendly size; JPEG/PNG/WebP/HEIC accepted.
- **D3 — Past days:** stay editable (plan, responses, reactions, missing ingredients). No locking.

- **D4 — Ratings:** keep only the current score per user and dish (`updatedAt`), no history.
- **D5 — Responses:** keep `not_home` as the fourth response.
- **D6 — Removed ingredients:** removing an ingredient from a dish deletes its `MissingIngredient` rows (cascade). Past meals stop showing it.
- **D7 — Modules:** `modules/dishes` (dishes, ingredients, ratings) and `modules/meals` (meals, responses, reactions, missing ingredients). `meals` uses `dishes` only through its public interface.
- **D8 — App access:** sign-in is shared by every app in `shared-apps`, so access is per app. An `app_member` table (appId, userId) lists who may use each app; only the family is a member of What's for dinner. This replaces a `Household` table.
- **Playbook, decided by Dino separately:** playbook ADR 0015 (i18n, proposed) and hosting (ADR 0014). Issues that depend on them are marked *blocked*.

## 9. Ideas for later (not committed)

- Extra dish feedback: "could change" / "not my favourite".
- Recipe change suggestions: a comment plus added or replaced ingredients, which the dish's author can accept.

## 10. Design rules (from the design guide)

- Palette B ("Verde de feira"), light and dark mode following the system. Use semantic tokens (`--wfd-*`), never raw hex.
- Fonts: Figtree (UI) and JetBrains Mono (numbers in the rating scale).
- Icons: 24 px stroke SVGs with `currentColor`, used through a sprite; 16 / 20 / 24 px sizes; icon-only buttons need `aria-label`.
- Logo v0: the "thinking face" mark in the header (30 px), empty and loading states, app icon and favicon.
- Every data screen has empty, loading and error / offline states. Offline copy: "Sem conexão. O que você já viu continua aqui." (show cached data read-only).
- Tone: humour in responses, the missing-ingredient alert, empty states and *Enjoei*; never in errors, offline or delete.
- Touch targets ≥ 44 px; state is never shown by colour alone; contrast ≥ 4.5:1 (checked in the guide).
- Deleting a dish asks for confirmation: "Excluir [prato]? As notas da família também somem. Não dá para desfazer."
- UI copy (pt-BR) is listed in the guide's "Textos do app" table; response labels stay in English for now. A "soft" version of the responses, per family, is a later idea.

## 11. Design files

The design package lives in this repo at `docs/apps/whats-for-dinner/design/` (texts in Portuguese). Issue 7 turns it into `packages/design-system`:

- `tokens-wfd.css` — `--wfd-*` colour, font and radius tokens, light and dark.
- `icons/*.svg` and `icons/sprite.svg` — 33 app icons (24 px grid, 1.5 stroke, `currentColor`; 5 are for Phase 2).
- `brand/` — logo v0: mark, lockup and app icon, light and dark (see `brand/README.md`).
- `PLANO.md` (product rules), `GUIA.md` (usage guide, UI copy, accessibility), `wireframes-finais.html` (offline prototype), `screenshots/`.
- Visual base: the SkiroLiro design system (`dinotudor/design-system`).

## 12. Dependencies on Dino

- For deployment only: VPS, domain, Google OAuth client, object storage bucket.
