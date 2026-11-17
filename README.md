# shared-apps

A workspace of small apps shared with a small group of collaborators. The apps share one design system, one sign-in and one database.

The first app is **What's for dinner**, a family meal planner. See its [brief](docs/apps/whats-for-dinner/brief.md).

## Layout

```
apps/            Deployed apps
  api/           Node API: Fastify 5 + tRPC at /trpc
  web/           Qwik 2 web app; its server code calls the API
packages/        Shared code
  api-core/      Shared tRPC setup
  design-system/ Tokens, icons, logo and base Qwik components
docs/            Briefs, issue plans and design files per app
```

Business logic will live in `modules/` (one package per domain area), wired together by `apps/api`.

## Getting started

You need [pnpm](https://pnpm.io/installation) 12. pnpm downloads the Node version pinned in `package.json` (`devEngines`), so you don't install Node yourself.

```sh
pnpm install
pnpm dev        # API on http://127.0.0.1:3000, web on http://localhost:5173
pnpm test       # every package in one Vitest run; pnpm test:ui opens the Vitest UI
```

The home page shows whether the web app can reach the API. `/design-system/` shows every base component, with a light and dark switch.

Check that the API is up:

```sh
curl http://127.0.0.1:3000/health
# {"status":"ok"}

curl http://127.0.0.1:3000/trpc/health.ping
# {"result":{"data":{"ok":true}}}
```

The API reads `PORT`, `HOST` and `LOG_LEVEL` from the environment and refuses to start if any of them is invalid. See [`apps/api/.env.example`](apps/api/.env.example). The web app reads `API_URL` (see [`apps/web/.env.example`](apps/web/.env.example)). In dev it defaults to the local API, and the production server refuses to start without it. Only its server code reads it: the browser never calls the API.

Before opening a PR, run:

```sh
pnpm typecheck && pnpm lint && pnpm test
```

## Engineering decisions

This repository follows a private engineering playbook. Its architecture decision records cover the main choices: a pnpm workspace with Node pinned through `devEngines`, TypeScript run natively by Node, a modular-monolith API on Fastify and tRPC, PostgreSQL with Drizzle, Better Auth sessions, and Vitest. Decisions specific to this repository go in `docs/adr/`.

## License

[MIT](LICENSE)
