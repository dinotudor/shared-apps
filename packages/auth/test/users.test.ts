import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startTestDatabase } from "@shared-apps/db/testing";
import type { TestDatabase } from "@shared-apps/db/testing";
import { findUserIdByEmail } from "../src/index.ts";
import { user } from "../src/schema.ts";

let database: TestDatabase;

beforeAll(async () => {
  database = await startTestDatabase();
  await database.db
    .insert(user)
    .values({ id: "user-ana", name: "Ana Teste", email: "ana@example.com" });
});

afterAll(async () => {
  await database.stop();
});

describe("finding a user by email", () => {
  it("finds the account of someone who has signed in", async () => {
    expect(await findUserIdByEmail(database.db, "ana@example.com")).toBe("user-ana");
  });

  it("matches the email the way the allowlist does: trimmed, without case", async () => {
    expect(await findUserIdByEmail(database.db, "  Ana@Example.COM ")).toBe("user-ana");
  });

  it("finds nobody for an email that has never signed in", async () => {
    expect(await findUserIdByEmail(database.db, "bruno@example.com")).toBeNull();
  });
});
