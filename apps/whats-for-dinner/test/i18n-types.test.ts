import { _ } from "compiled-i18n";
import { describe, expectTypeOf, it } from "vitest";

// Checked by `pnpm typecheck`: our own declaration of `_` (types/compiled-i18n.d.ts)
// replaces the package's, which is `any` under skipLibCheck.
describe("the _ tag", () => {
  it("returns a string", () => {
    expectTypeOf(_`Hello ${"Ana"}!`).toEqualTypeOf<string>();
  });

  it("can't be called as a function, which the build would not inline", () => {
    // @ts-expect-error -- only the tagged template is extracted and translated at build time.
    expectTypeOf(_("Hello")).toEqualTypeOf<string>();
  });
});
