# What's for dinner? with the SkiroLiro identity

Base: the brainstorm handoff and earlier research (PRD, data model). The original wireframe canvas could not be opened.

Rule: "let's order" and "going out" create a notice on the day, without changing the plan.

## Concept
A playful, mobile-first web app for the family to plan the week's dinners. Each day has a dish, "Skip dinner" or "Free-style". Everyone reacts with emojis, responds and says what is missing. UI in Portuguese, code in English, no external communication in the MVP.

## Screens
1. **Week**: 7 days (dish / Skip / Free-style), status and reactions; empty day = "+ Planejar". Tabs Week and Dishes.
2. **Day**: photo, who planned it, alert "Ingrediente faltando! Quem vai? 😄", day notice, 4 responses, checklist (all checked), reactions.
3. **Plan a day**: Skip dinner, Free-style or a saved dish (search, average, times cooked, who is fed up).
4. **Dishes**: search, sort (most cooked, best score, recent), cards with average, my score and Enjoei.
5. **Dish**: score 0–10 (face per band: 0–4, 5–7, 8–10), Enjoei (3 weeks), family scores, ingredients, preparation.
6. **New/edit dish**: photo, name, ingredients (name + quantity), preparation, save, delete.

## Responses (original text kept)
cant_wait "MMMM can't wait!" · lets_order "F*#% it, let's order!" · going_out "I'm in the mood for going out tonight ;)" · not_home "Not home tonight"
A "soft" version is planned for the future (an option in settings).

## Identity applied
- Blue to act; green for planned, at home and high score; amber only for missing ingredient and the day notice.
- A score always shows face + band + number, never colour alone.
- Family reactions are real emojis (content); the interface uses the brand's line icons.
- The two dots of the logo become the "decided" smile and appear in empty/loading states.
- Humour in responses, the alert, empty states and Enjoei; never in errors, offline or delete.

## Enjoei (decided)
Each person marks it on the Dish screen. The notice ("Fulano enjoou") shows in Plan a day and in the Day detail, for 3 weeks.

## Phase 2 (anticipated in the design)
Month (same day card, smaller), messages (3rd tab), statistics, shopping list (born from "missing ingredients"), stickers on the photo.

## Icons
41 icons in `icons/` (24 grid, 1.5 stroke) and `icons/sprite.svg`. Includes score faces (sick, neutral, love), Enjoei, skip, freestyle, missing ingredient, responses, reactions and Phase 2.

## Open questions
- Soft version (future): chosen per family or per person?
- When does the "day notice" appear?
- Reactions: fixed list or any emoji?

## Logo and app icon (v0 approved)
Approved by Dino on 2026-11-08, to be refined later. A hand-drawn thinking face (mint face, big white eyes, one raised eyebrow, straight mouth) with the name in Figtree Bold. Files in `brand/` (light and dark lockups, mark, 1024 px app icon). Discarded explorations in `brand/explorations/`.

## Final identity (2026-11-08)
- Palette B, Verde de feira: action in green (#0F7A5C light / #4FE0B0 dark), navy text, backgrounds with a light green tint, amber for attention.
- Logo v0 (thinking face) in the header and in empty/loading states; files in `brand/`.
- Icons: 33, only for app use (`icons/`). Emojis for responses, scores, reactions and Enjoei.
- Final wireframes, Play (clickable prototype) and usage Guide: `wireframes-final.html` (and light/dark PNGs).
- Reactions: any emoji. Soft version of the responses: per family, later.
- Tokens in `tokens-wfd.css`.
