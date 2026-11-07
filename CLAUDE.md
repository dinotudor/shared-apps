# CLAUDE.md

## Project

`shared-apps` is the pnpm workspace monorepo for small apps used by a small group of collaborators, built by one developer working with agents. The apps share a design system, sign-in and a database (ADR 0003 in `engineering-playbook`). Stage: the workspace is set up, with no apps, modules or packages yet.

## Shared guidelines

@~/Github/engineering-playbook/guidelines/typescript.md
@~/Github/engineering-playbook/guidelines/tooling.md
@~/Github/engineering-playbook/guidelines/backend.md
@~/Github/engineering-playbook/guidelines/domain-modeling.md
@~/Github/engineering-playbook/guidelines/testing.md
@~/Github/engineering-playbook/guidelines/git.md
@~/Github/engineering-playbook/guidelines/security.md

Implementation workflow: @~/Github/engineering-playbook/processes/implement-issue.md

## Language

Everything in this repo is in English: code, comments, commits, branches, PRs, issues, docs. The user may talk to you in Portuguese; answer in their language, but write repo content in English.

## Project specifics

- Packages are named `@shared-apps/<folder>`.
- Nothing else differs from the shared guidelines yet.

## Working with me

- Explain non-obvious decisions briefly — I want to understand the *why*.
- If a requirement is unclear, ask instead of guessing.
- Project ADRs live in `docs/adr/`. Domain terms live in `GLOSSARY.md`.
