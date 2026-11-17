# shared-apps

A workspace of small apps shared with a small group of collaborators. The apps share one design system, one sign-in and one database.

The first app is **What's for dinner**, a family meal planner. See its [brief](docs/apps/whats-for-dinner/brief.md).

## Layout

```
apps/       Deployed apps
  api/      Node API: Fastify 5 + tRPC at /trpc
packages/   Shared code
  api-core/ Shared tRPC setup
docs/       Briefs, issue plans and design files per app
```

Business logic will live in `modules/` (one package per domain area), wired together by `apps/api`.

## Getting started

You need [pnpm](https://pnpm.io/installation) 12. pnpm downloads the Node version pinned in `package.json` (`devEngines`), so you don't install Node yourself.

```sh
pnpm install
pnpm dev        # starts the API on http://127.0.0.1:3000
pnpm test
```

Check that the API is up:

```sh
curl http://127.0.0.1:3000/health
# {"status":"ok"}

curl http://127.0.0.1:3000/trpc/health.ping
# {"result":{"data":{"ok":true}}}
```

The API reads `PORT`, `HOST` and `LOG_LEVEL` from the environment and refuses to start if any of them is invalid. See [`apps/api/.env.example`](apps/api/.env.example).

Before opening a PR, run:

```sh
pnpm typecheck && pnpm lint && pnpm test
```

## Engineering decisions

This repository follows a private engineering playbook. Its architecture decision records cover the main choices: a pnpm workspace with Node pinned through `devEngines`, TypeScript run natively by Node, a modular-monolith API on Fastify and tRPC, PostgreSQL with Drizzle, Better Auth sessions, and Vitest. Decisions specific to this repository go in `docs/adr/`.

## License

[MIT](LICENSE)
