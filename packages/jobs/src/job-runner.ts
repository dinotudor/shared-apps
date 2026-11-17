import { PgBoss } from "pg-boss";

/** The subset of Pino (Fastify's `app.log`) the runner and handlers use. */
export type JobLogger = {
  info: (fields: Record<string, unknown>, message: string) => void;
  error: (fields: Record<string, unknown>, message: string) => void;
};

export type JobContext = { jobId: string; log: JobLogger };

/**
 * A job a module declares. The payload is stored as JSON, so it must be a plain object.
 * Payloads may hold personal data: they are never logged.
 */
export type JobDefinition<TData extends object> = {
  /** The pg-boss queue name. Prefix it with the module name, such as `meals.send-reminder`. */
  name: string;
  handler: (data: TData, context: JobContext) => Promise<void>;
};

export const defineJob = <TData extends object>(
  definition: JobDefinition<TData>,
): JobDefinition<TData> => definition;

/** What services receive: they can send jobs, nothing else. */
export type JobQueue = {
  send: <TData extends object>(job: JobDefinition<TData>, data: TData) => Promise<void>;
};

export type JobRunner = JobQueue & {
  /** Creates the queues, starts the workers. Rejects if the database is unreachable. */
  start: () => Promise<void>;
  stop: () => Promise<void>;
};

/** A job pg-boss sends on a cron schedule, in UTC. Scheduled jobs take no payload. */
export type ScheduledJob = {
  job: JobDefinition<Record<string, never>>;
  cron: string;
};

export type JobRunnerOptions = {
  url: string;
  log: JobLogger;
  // `never` accepts a definition with any payload: a handler that takes some payload
  // is assignable to one that takes `never`.
  jobs: readonly JobDefinition<never>[];
  /** Their jobs get workers too, so they don't need to be listed in `jobs` as well. */
  schedules: readonly ScheduledJob[];
  stopTimeoutMs: number;
  /** How often idle workers poll. pg-boss's default is 2 s; tests use its minimum, 0.5. */
  pollingIntervalSeconds?: number;
};

export const createJobRunner = ({
  url,
  log,
  jobs,
  schedules,
  stopTimeoutMs,
  pollingIntervalSeconds,
}: JobRunnerOptions): JobRunner => {
  // A pool of its own, separate from the requests' pool, so polling never takes the
  // connections requests need. Workers poll one at a time; 3 leaves room for send()
  // and pg-boss's maintenance.
  const boss = new PgBoss({ connectionString: url, max: 3 });
  // pg-boss emits `error` for failures outside a handler, such as a lost connection or
  // a failed maintenance run. Without a listener, EventEmitter would crash the process.
  boss.on("error", (error) => {
    log.error({ err: error }, "pg-boss error");
  });
  // Job ID → queue, for the jobs whose handler is running now.
  const running = new Map<string, string>();

  const run = async (job: JobDefinition<never>, id: string, data: object) => {
    running.set(id, job.name);
    try {
      // Stored by send() from a JobDefinition<TData> with the same name.
      await job.handler(data as never, { jobId: id, log });
    } catch (error) {
      // The one place failures are logged, so no handler has to remember to.
      log.error({ err: error, queue: job.name, jobId: id }, "job failed");
      // Rethrown so pg-boss records the failure and retries the job.
      throw error;
    } finally {
      running.delete(id);
    }
  };

  return {
    start: async () => {
      await boss.start();
      const workers = new Map<string, JobDefinition<never>>();
      for (const job of [...jobs, ...schedules.map((schedule) => schedule.job)]) {
        workers.set(job.name, job);
      }
      // Left out when not given: pg-boss rejects an explicit `undefined`.
      const workOptions = pollingIntervalSeconds === undefined ? {} : { pollingIntervalSeconds };
      for (const job of workers.values()) {
        await boss.createQueue(job.name);
        await boss.work<object>(job.name, workOptions, async (batch) => {
          for (const { id, data } of batch) await run(job, id, data);
        });
      }
      // An upsert: restarting the API, or running several instances, keeps one schedule each.
      for (const { job, cron } of schedules) await boss.schedule(job.name, cron, {});
    },
    stop: async () => {
      // Stops polling, then waits up to the timeout for running handlers to finish.
      // pg-boss then marks the jobs still running as failed, so they are retried later.
      await boss.stop({ graceful: true, timeout: stopTimeoutMs });
      for (const [jobId, queue] of running) {
        log.error({ queue, jobId }, "job still running at shutdown; marked as failed");
      }
    },
    send: async (job, data) => {
      await boss.send(job.name, data);
    },
  };
};
