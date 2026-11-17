import { format, resolveConfig } from "prettier";
import { renderTokensCss } from "../src/tokens.ts";

export const TOKENS_CSS_PATH = new URL("../src/tokens.css", import.meta.url);

/** tokens.css as committed: rendered from tokens.ts, then formatted like every other file. */
export const tokensCss = async (): Promise<string> => {
  const config = await resolveConfig(TOKENS_CSS_PATH);
  return format(renderTokensCss(), { ...config, parser: "css" });
};
