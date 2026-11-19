import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { App } from "@shared-apps/api-core";
import { createTestUser } from "@shared-apps/auth/testing";
import { startTestDatabase } from "@shared-apps/db/testing";
import type { TestDatabase } from "@shared-apps/db/testing";
import { createMembership } from "@shared-apps/membership";
import type { Membership } from "@shared-apps/membership";
import { addMembers, parseAddMembersArgs } from "../src/members.ts";

const API_DIR = fileURLToPath(new URL("..", import.meta.url));

let database: TestDatabase;
let membership: Membership;

/** Runs `members:add` as a person would, against the test database. */
const runScript = (args: readonly string[]) =>
  new Promise<{ exitCode: number; stdout: string }>((resolve) => {
    execFile(
      process.execPath,
      ["src/add-members.ts", ...args],
      { cwd: API_DIR, env: { ...process.env, DATABASE_URL: database.url } },
      (error, stdout) => {
        resolve({ exitCode: typeof error?.code === "number" ? error.code : 0, stdout });
      },
    );
  });

const collect = async <T>(results: AsyncIterable<T>): Promise<T[]> => {
  const all: T[] = [];
  for await (const result of results) all.push(result);
  return all;
};

beforeAll(async () => {
  database = await startTestDatabase();
  membership = createMembership(database.db);
  for (const name of ["ana", "bruno", "carla", "davi"]) {
    await createTestUser(database.db, { id: `user-${name}`, name, email: `${name}@example.com` });
  }
});

afterAll(async () => {
  await database.stop();
});

describe("adding members by email", () => {
  it("adds people who have signed in, and reports who has no account yet", async () => {
    const results = await collect(
      addMembers({ db: database.db, membership }, App.WhatsForDinner, [
        "ana@example.com",
        "nobody@example.com",
      ]),
    );

    expect(results).toEqual([
      { email: "ana@example.com", result: "added" },
      { email: "nobody@example.com", result: "no-account" },
    ]);
    expect(await membership.isMember(App.WhatsForDinner, "user-ana")).toBe(true);
  });

  it("can run again: someone added before is reported as already a member", async () => {
    await collect(
      addMembers({ db: database.db, membership }, App.WhatsForDinner, ["Bruno@Example.com"]),
    );

    const results = await collect(
      addMembers({ db: database.db, membership }, App.WhatsForDinner, ["bruno@example.com"]),
    );

    expect(results).toEqual([{ email: "bruno@example.com", result: "already-member" }]);
  });
});

describe("the members:add script", () => {
  it("exits 0 and prints each result when everyone is added", async () => {
    const { exitCode, stdout } = await runScript(["whats-for-dinner", "carla@example.com"]);

    expect(exitCode).toBe(0);
    expect(stdout).toBe("carla@example.com: added\n");
  });

  it("exits 1 when an email has no account, after adding the others", async () => {
    const { exitCode, stdout } = await runScript([
      "whats-for-dinner",
      "davi@example.com",
      "nobody@example.com",
    ]);

    expect(exitCode).toBe(1);
    expect(stdout).toBe(
      "davi@example.com: added\n" +
        "nobody@example.com: no account: they must sign in once before they can be added\n",
    );
    expect(await membership.isMember(App.WhatsForDinner, "user-davi")).toBe(true);
  });

  it("exits 1 without touching the database when the arguments are wrong", async () => {
    const { exitCode, stdout } = await runScript(["no-such-app", "ana@example.com"]);

    expect(exitCode).toBe(1);
    expect(stdout).toBe("");
  });
});

describe("reading the script's arguments", () => {
  it("takes an app and one or more emails", () => {
    expect(
      parseAddMembersArgs(["whats-for-dinner", "ana@example.com", "bruno@example.com"]),
    ).toEqual({
      app: "whats-for-dinner",
      emails: ["ana@example.com", "bruno@example.com"],
    });
  });

  it("refuses an app that doesn't exist", () => {
    expect(() => parseAddMembersArgs(["no-such-app", "ana@example.com"])).toThrow(/app/);
  });

  it("refuses a call without emails, or with something that isn't one", () => {
    expect(() => parseAddMembersArgs(["whats-for-dinner"])).toThrow(/email/);
    expect(() => parseAddMembersArgs(["whats-for-dinner", "not-an-email"])).toThrow(/email/);
  });
});
