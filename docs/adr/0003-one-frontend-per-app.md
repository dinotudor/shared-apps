# 0003. One frontend per collaborator app

- Status: accepted
- Date: 2026-11-17
- Issue: #19

## Context

Playbook ADR 0003 puts every collaborator app in one workspace monorepo, with `apps/` for deployed apps and one API. It does not say whether one web app hosts every collaborator app or each app gets its own. The first frontend was scaffolded as `apps/web` before the question came up. Issue #19 (app shell) is the point where the answer starts to show in code: the header, navigation, icons and manifest all belong to one app.

## Decision

Each collaborator app gets its own frontend in `apps/<app>`, named after the app. `apps/web` becomes `apps/whats-for-dinner` (`@shared-apps/whats-for-dinner`).

- Shared UI stays in `packages/` (the design system today), so a new frontend starts from shared components, not copies.
- `apps/api` stays the single backend for every app, as in playbook ADR 0005.
- Rules about frontends apply to `apps/*` except `apps/api`, so a new app is covered without changing config. Today that means the ESLint rule that keeps the tRPC client in server code.

## Alternatives considered

- **One web app with a section per app** (`/dinner/…`, `/other/…`). It means one deploy and one place for sign-in. But each app has its own name, icon, home screen and navigation, and collaborators install them separately on their phones. Sharing one shell would mean per-app switches in the layout, the manifest and the service worker. One bad frontend deploy would also take down every app.
- **Keep `apps/web` and add `apps/<name>-web` for later apps**, as the playbook's tooling guide suggests. That makes the first app special for no reason. The folder name would not say which app it is.

## Consequences

- Each frontend has its own deploy, port, manifest and icons. Issue #34 (container images) builds one image per frontend.
- Signing in is still shared through `apps/api`, but each frontend has its own sign-in page. If apps are deployed on separate subdomains, sharing the session cookie across them is an open question for #15.
- Code shared by two frontends goes into `packages/`, not from one app into another. Apps never import from each other.
- ADR 0001 says `apps/web`. Read it as `apps/whats-for-dinner`.
