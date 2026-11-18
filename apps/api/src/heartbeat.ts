import { defineJob } from "@shared-apps/jobs";
import type { ScheduledJob } from "@shared-apps/jobs";

// Lives in the app, like /health: it has no business rules. A heartbeat line every
// minute in the logs shows that scheduling and workers are alive.
export const heartbeat: ScheduledJob = {
  job: defineJob<Record<string, never>>({
    name: "api.heartbeat",
    handler: (_data, { jobId, log }) => {
      log.info({ jobId }, "heartbeat");
      return Promise.resolve();
    },
  }),
  cron: "* * * * *",
};
