import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { App } from "@shared-apps/api-core";
import { user } from "@shared-apps/auth/schema";
import { startTestDatabase } from "@shared-apps/db/testing";
import type { TestDatabase } from "@shared-apps/db/testing";
import { createMembership } from "@shared-apps/membership";
import { addMembers, parseAddMembersArgs } from "../src/members.ts";

let database: TestDatabase;

beforeAll(async () => {
  database = await startTestDatabase();
  // Accounts Better Auth created when these people first signed in.
  await database.db.insert(user).values([
    { id: "user-ana", name: "Ana Teste", email: "ana@example.com" },
    { id: "user-bruno", name: "Bruno Teste", email: "bruno@example.com" },
  ]);
});

afterAll(async () => {
  await database.stop();
});

describe("adding members by email", () => {
  it("adds people who have signed in, and reports who has no account yet", async () => {
    const results = await addMembers(database.db, App.WhatsForDinner, [
      "ana@example.com",
      "carla@example.com",
    ]);

    expect(results).toEqual([
      { email: "ana@example.com", result: "added" },
      { email: "carla@example.com", result: "no-account" },
    ]);
    expect(await createMembership(database.db).isMember(App.WhatsForDinner, "user-ana")).toBe(true);
  });

  it("can run again: someone added before is reported as already a member", async () => {
    await addMembers(database.db, App.WhatsForDinner, ["Bruno@Example.com"]);

    const results = await addMembers(database.db, App.WhatsForDinner, ["bruno@example.com"]);

    expect(results).toEqual([{ email: "bruno@example.com", result: "already-member" }]);
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
