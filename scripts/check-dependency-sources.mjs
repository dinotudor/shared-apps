// Fails when a package.json installs a dependency from git or a URL.
// pnpm's blockExoticSubdeps only covers transitive dependencies.
import { globSync, readFileSync } from "node:fs";

// "<package>@<spec>" entries approved by an ADR.
const ALLOWED = [];

const DEPENDENCY_FIELDS = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
];
const EXOTIC_SPEC = /^(git[+:]|git@|github:|gitlab:|bitbucket:|https?:)|^[^@/:\s]+\/\S+$/;

const manifests = globSync("{package.json,{apps,modules,packages}/*/package.json}");

const violations = manifests.flatMap((file) => {
  const manifest = JSON.parse(readFileSync(file, "utf8"));
  return DEPENDENCY_FIELDS.flatMap((field) =>
    Object.entries(manifest[field] ?? {})
      .filter(([name, spec]) => EXOTIC_SPEC.test(spec) && !ALLOWED.includes(`${name}@${spec}`))
      .map(([name, spec]) => `${file}: ${name}@${spec}`),
  );
});

if (violations.length > 0) {
  console.error("Dependencies must come from the registry:");
  console.error(violations.join("\n"));
  process.exit(1);
}

console.log(`Checked ${manifests.length} package.json files.`);
