import { writeFileSync } from "node:fs";
import { TOKENS_CSS_PATH, tokensCss } from "./tokens-css.ts";

writeFileSync(TOKENS_CSS_PATH, await tokensCss());
console.log(`Wrote ${TOKENS_CSS_PATH.pathname}`);
