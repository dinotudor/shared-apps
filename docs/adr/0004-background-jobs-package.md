# 0004. Background jobs go through packages/jobs, which fails the API's startup if it can't start

- Status: accepted
- Date: 2026-11-17
- Issue: #17

## Context

Playbook ADR 0009 runs pg-boss inside the API process. Modules will need jobs, starting with reminders (#21+). If each module called pg-boss directly, every one of them would repeat its setup, failure logging and shutdown handling, and their tests would need a real queue. The API also has a 10 s graceful shutdown budget, which pg-boss has to fit in.

## Decision

1. **`packages/jobs` (`@shared-apps/jobs`) is the only package that imports pg-boss.** Its interface:
   - `defineJob<TData>({ name, handler })`: a module declares a job.
   - `JobQueue` (`send(job, data)`): what a service receives. The payload type comes from the definition.
   - `createJobRunner({ url, log, jobs, schedules, stopTimeoutMs })`: used only by `apps/api`, which passes every module's jobs and schedules.
2. **The runner logs every failure in one place.** It logs a handler error with the queue and job ID, then rethrows it so pg-boss records the failure and retries. pg-boss's own `error` event goes to the same logger, and so does any job that is still running when shutdown gives up on it. Payloads are never logged.
3. **pg-boss has its own pool** (3 connections), separate from the requests' pool. Polling can then never take connections that requests need. Its tables stay in its `pgboss` schema (ADR 0002).
4. **pg-boss starts in Fastify's `onReady` hook, so a failed start fails the API's startup.** If the database is unreachable at boot, `listen()` rejects, the process exits 1, and the container restarts. An API that serves requests while its jobs silently don't run is harder to notice than one that doesn't start.
5. **Shutdown gives running jobs half the budget (5 s).** pg-boss stops polling, waits for running handlers up to that timeout, then marks the jobs still running as failed, so they are retried later. The rest of the budget covers in-flight requests and closing the pool.
6. **Payloads are typed but not validated at runtime.** They come from our own code through `send`. A job whose payload comes from outside gets a Zod schema when it appears.

## Alternatives considered

- **Modules use pg-boss directly:** no extra package, but every module repeats setup and failure logging, and their tests need Postgres to send a job.
- **Share the requests' pool:** one fewer pool, but a burst of jobs could leave requests waiting for a connection.
- **Start pg-boss in the background and log failures:** the API serves even with the database down at boot, but jobs could stay off without anyone noticing.

## Consequences

- Services take a `JobQueue`. Their unit tests pass a fake, and no container is needed.
- A pg-boss upgrade migrates the `pgboss` schema on `start()`, outside the Drizzle history. Renovate doesn't auto-merge it (it's a runtime dependency), but those PRs need a manual look at pg-boss's release notes.
- A schedule removed from code stays in the `pgboss.schedule` table until it is removed with `unschedule`. This should be handled when the first schedule is retired.
- With the database down at boot, the API now refuses to start. Before, it started and failed on the first query.
