import { afterEach, describe, expect, it } from "vitest";
import { PgBoss } from "pg-boss";
import { startEmptyDatabase } from "@shared-apps/db/testing";
import type { TestDatabase } from "@shared-apps/db/testing";
import { createJobRunner, defineJob } from "../src/index.ts";
import type { JobDefinition, JobLogger, JobRunner, ScheduledJob } from "../src/index.ts";

type LogEntry = { level: "info" | "error"; fields: Record<string, unknown>; message: string };

const recordingLogger = () => {
  const entries: LogEntry[] = [];
  const log: JobLogger = {
    info: (fields, message) => entries.push({ level: "info", fields, message }),
    error: (fields, message) => entries.push({ level: "error", fields, message }),
  };
  return { log, entries };
};

let database: TestDatabase | undefined;
let runner: JobRunner | undefined;

afterEach(async () => {
  await runner?.stop();
  runner = undefined;
  await database?.stop();
  database = undefined;
});

const startRunner = async (
  jobs: readonly JobDefinition<never>[],
  options: {
    stopTimeoutMs?: number;
    schedules?: readonly ScheduledJob[];
    pollingIntervalSeconds?: number;
  } = {},
) => {
  database = await startEmptyDatabase();
  const { url } = database;
  const { log, entries } = recordingLogger();
  runner = createJobRunner({
    url,
    log,
    jobs,
    schedules: options.schedules ?? [],
    stopTimeoutMs: options.stopTimeoutMs ?? 5_000,
    // The minimum pg-boss allows, so tests don't wait out the 2 s default.
    pollingIntervalSeconds:
      "pollingIntervalSeconds" in options ? options.pollingIntervalSeconds : 0.5,
  });
  await runner.start();
  return { runner, entries, url };
};

describe("job runner", () => {
  it("runs the handler of a sent job with its payload", async () => {
    const received: { dishId: string }[] = [];
    const remember = defineJob<{ dishId: string }>({
      name: "test.remember",
      handler: (data) => {
        received.push(data);
        return Promise.resolve();
      },
    });
    const { runner } = await startRunner([remember]);

    await runner.send(remember, { dishId: "dish-1" });

    await expect.poll(() => received, { timeout: 10_000 }).toEqual([{ dishId: "dish-1" }]);
  });

  it("runs jobs with pg-boss's default polling interval when none is given", async () => {
    const received: { dishId: string }[] = [];
    const remember = defineJob<{ dishId: string }>({
      name: "test.remember",
      handler: (data) => {
        received.push(data);
        return Promise.resolve();
      },
    });
    const { runner } = await startRunner([remember], { pollingIntervalSeconds: undefined });

    await runner.send(remember, { dishId: "dish-1" });

    await expect.poll(() => received, { timeout: 10_000 }).toEqual([{ dishId: "dish-1" }]);
  });

  it("logs a job whose handler throws, with its queue, job ID and error", async () => {
    const failure = new Error("dish not found");
    const broken = defineJob<{ dishId: string }>({
      name: "test.broken",
      handler: () => Promise.reject(failure),
    });
    const { runner, entries } = await startRunner([broken]);

    await runner.send(broken, { dishId: "dish-1" });

    // pg-boss retries a failed job (twice, by default), and every attempt is logged.
    await expect
      .poll(() => entries, { timeout: 10_000 })
      .toContainEqual({
        level: "error",
        fields: { err: failure, queue: "test.broken", jobId: expect.any(String) as string },
        message: "job failed",
      });
  });

  it("registers a scheduled job with its cron expression", async () => {
    const tick = defineJob<Record<string, never>>({
      name: "test.tick",
      handler: () => Promise.resolve(),
    });
    const { url } = await startRunner([], { schedules: [{ job: tick, cron: "* * * * *" }] });

    // Waiting for the cron to fire would take up to a minute, so ask pg-boss instead.
    const observer = new PgBoss({ connectionString: url, supervise: false, schedule: false });
    await observer.start();
    try {
      const schedules = await observer.getSchedules();
      expect(schedules.map(({ name, cron }) => ({ name, cron }))).toEqual([
        { name: "test.tick", cron: "* * * * *" },
      ]);
    } finally {
      await observer.stop();
    }
  });

  describe("stop()", () => {
    // A job whose handler runs until the test releases it.
    const blockingJob = () => {
      let started = false;
      let release = () => {};
      const job = defineJob<Record<string, never>>({
        name: "test.slow",
        handler: () => {
          started = true;
          return new Promise<void>((resolve) => {
            release = resolve;
          });
        },
      });
      return {
        job,
        hasStarted: () => started,
        release: () => {
          release();
        },
      };
    };

    const settledWithin = async (promise: Promise<unknown>, ms: number) => {
      const timeout = new Promise<false>((resolve) =>
        setTimeout(() => {
          resolve(false);
        }, ms),
      );
      return Promise.race([promise.then(() => true), timeout]);
    };

    it("waits for a running job to finish", async () => {
      const slow = blockingJob();
      const { runner } = await startRunner([slow.job], { stopTimeoutMs: 10_000 });
      await runner.send(slow.job, {});
      await expect.poll(slow.hasStarted, { timeout: 10_000 }).toBe(true);

      const stopping = runner.stop();

      // Polling has stopped by now; stop() must still be waiting on the job.
      expect(await settledWithin(stopping, 1_000)).toBe(false);
      slow.release();
      expect(await settledWithin(stopping, 2_000)).toBe(true);
    });

    it("gives up on a job still running after the timeout, and logs it as failed", async () => {
      const slow = blockingJob();
      const { runner, entries } = await startRunner([slow.job], { stopTimeoutMs: 500 });
      await runner.send(slow.job, {});
      await expect.poll(slow.hasStarted, { timeout: 10_000 }).toBe(true);

      const stopping = runner.stop();

      // The 500 ms timeout, plus room for closing the pool.
      expect(await settledWithin(stopping, 2_000)).toBe(true);
      expect(entries).toContainEqual({
        level: "error",
        fields: { queue: "test.slow", jobId: expect.any(String) as string },
        message: "job still running at shutdown; marked as failed",
      });
      slow.release();
    });
  });
});
