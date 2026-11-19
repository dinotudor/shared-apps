import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { App } from "@shared-apps/api-core";
import { createTestUser, deleteTestUser } from "@shared-apps/auth/testing";
import { startTestDatabase } from "@shared-apps/db/testing";
import type { TestDatabase } from "@shared-apps/db/testing";
import { createMembership } from "../src/index.ts";
import type { Membership } from "../src/index.ts";

let database: TestDatabase;
let membership: Membership;

/** A collaborator who has signed in once, so their account exists. */
const signedUp = (id: string) =>
  createTestUser(database.db, { id, name: `Teste ${id}`, email: `${id}@example.com` });

beforeAll(async () => {
  database = await startTestDatabase();
  membership = createMembership(database.db);
});

afterAll(async () => {
  await database.stop();
});

describe("app membership", () => {
  it("does not count a signed-up collaborator as a member until they are added", async () => {
    const ana = await signedUp("ana");

    expect(await membership.isMember(App.WhatsForDinner, ana)).toBe(false);
  });

  it("counts a collaborator as a member once they are added", async () => {
    const bruno = await signedUp("bruno");

    expect(await membership.add(App.WhatsForDinner, bruno)).toBe("added");
    expect(await membership.isMember(App.WhatsForDinner, bruno)).toBe(true);
  });

  it("adds someone who is already a member again without failing", async () => {
    const carla = await signedUp("carla");
    await membership.add(App.WhatsForDinner, carla);

    expect(await membership.add(App.WhatsForDinner, carla)).toBe("already-member");
    expect(await membership.isMember(App.WhatsForDinner, carla)).toBe(true);
  });

  it("ends the membership when the collaborator's account is deleted", async () => {
    const davi = await signedUp("davi");
    await membership.add(App.WhatsForDinner, davi);

    await deleteTestUser(database.db, davi);

    expect(await membership.isMember(App.WhatsForDinner, davi)).toBe(false);
  });
});
