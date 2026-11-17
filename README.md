# shared-apps

A workspace of small apps shared with a small group of collaborators. The apps share one design system, one sign-in and one database.

The first app is **What's for dinner**, a family meal planner. See its [brief](docs/apps/whats-for-dinner/brief.md).

## Layout

```
apps/                Deployed apps
  api/               Node API: Fastify 5 + tRPC at /trpc
  whats-for-dinner/  Qwik 2 frontend for What's for dinner; its server code calls the API
packages/            Shared code
  api-core/          Shared tRPC setup
  db/                PostgreSQL connection, the one migration history, test databases
  design-system/     Tokens, icons, logo and base Qwik components
docs/                Briefs, issue plans and design files per app
```

Each collaborator app has its own frontend in `apps/<app>`, and they all share `apps/api` ([ADR 0003](docs/adr/0003-one-frontend-per-app.md)). Business logic will live in `modules/` (one package per domain area), wired together by `apps/api`.

## Getting started

You need [pnpm](https://pnpm.io/installation) 12 and Docker. pnpm downloads the Node version pinned in `package.json` (`devEngines`), so you don't install Node yourself. Docker runs the local PostgreSQL and the database tests.

```sh
pnpm install
docker compose up -d --wait                  # PostgreSQL on 127.0.0.1:5433
cp apps/api/.env.example apps/api/.env       # points DATABASE_URL at it
pnpm db:migrate
pnpm dev:wfdinner  # API on http://127.0.0.1:3000 and What's for dinner on http://localhost:5173
pnpm test          # every package in one Vitest run; pnpm test:ui opens the Vitest UI
```

Each app has a root `dev:<short-name>` script that starts the API and that app's frontend ([ADR 0003](docs/adr/0003-one-frontend-per-app.md)). The API needs PostgreSQL, so run `docker compose up -d --wait` first. `pnpm dev` starts every app at once.

| App | Script |
|---|---|
| What's for dinner | `pnpm dev:wfdinner` |

The home page shows whether the frontend can reach the API. `/design-system/` shows every base component, with a light and dark switch.

Check that the API is up:

```sh
curl http://127.0.0.1:3000/health
# {"status":"ok"}

curl http://127.0.0.1:3000/trpc/health.ping
# {"result":{"data":{"ok":true}}}
```

The API reads `PORT`, `HOST`, `LOG_LEVEL` and `DATABASE_URL` (required) from the environment and refuses to start if any of them is invalid. See [`apps/api/.env.example`](apps/api/.env.example). The frontend reads `API_URL` (see [`apps/whats-for-dinner/.env.example`](apps/whats-for-dinner/.env.example)). In dev it defaults to the local API, and the production server refuses to start without it. Only its server code reads it: the browser never calls the API.

Database tests start their own disposable PostgreSQL through Testcontainers, so they don't touch the compose database. See [`packages/db`](packages/db/README.md) for the migration workflow.

Before opening a PR, run:

```sh
pnpm typecheck && pnpm lint && pnpm test
```

## Engineering decisions

This repository follows a private engineering playbook. Its architecture decision records cover the main choices: a pnpm workspace with Node pinned through `devEngines`, TypeScript run natively by Node, a modular-monolith API on Fastify and tRPC, PostgreSQL with Drizzle, Better Auth sessions, and Vitest. Decisions specific to this repository go in `docs/adr/`.

## License

[MIT](LICENSE)
