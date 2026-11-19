import { describe, expect, it } from "vitest";
import { keysInSource } from "../scripts/i18n/source-keys.ts";

const keys = (code: string) => [...keysInSource(code, "file.tsx")];

describe("keysInSource", () => {
  it("finds the key of each _ tagged template", () => {
    const code = `import { _ } from "compiled-i18n";\nconst a = _\`Week\`;\nconst b = <p>{_\`Dishes\`}</p>;`;
    expect(keys(code)).toEqual(["Week", "Dishes"]);
  });

  it("numbers interpolations and nests translations, as compiled-i18n does", () => {
    const code = `import { _ } from "compiled-i18n";\n_\`Delete \${_\`Steak\`}? \${a} and \${b}\`;`;
    expect(keys(code)).toEqual(["Delete $1? $2 and $3", "Steak"]);
  });

  it("escapes a literal dollar sign as $$", () => {
    const code = `import { _ } from "compiled-i18n";\n_\`Costs $5\`;`;
    expect(keys(code)).toEqual(["Costs $$5"]);
  });

  it("follows a renamed import and ignores other tags", () => {
    const code = `import { _ as t } from "compiled-i18n";\nimport { _ } from "other";\nt\`Week\`; _\`Not ours\`; css\`a\`;`;
    expect(keys(code)).toEqual(["Week"]);
  });
});
