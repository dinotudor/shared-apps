import { writeFileSync } from "node:fs";
import { renderTokensCss } from "../src/tokens.ts";

const target = new URL("../src/tokens.css", import.meta.url);
writeFileSync(target, renderTokensCss());
console.log(`Wrote ${target.pathname}`);
