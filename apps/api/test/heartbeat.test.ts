import { describe, expect, it, vi } from "vitest";
import { heartbeat } from "../src/heartbeat.ts";

describe("heartbeat job", () => {
  it("logs a heartbeat line with its job ID", async () => {
    const log = { info: vi.fn(), error: vi.fn() };

    await heartbeat.job.handler({}, { jobId: "job-1", log });

    expect(log.info).toHaveBeenCalledExactlyOnceWith({ jobId: "job-1" }, "heartbeat");
    expect(log.error).not.toHaveBeenCalled();
  });
});
