// The translation provider: the only file that knows about Claude. To switch to another
// LLM or to DeepL, write another TranslateBatch and pick it in i18n-translate.ts.
import Anthropic from "@anthropic-ai/sdk";
import { isNamedKey } from "./check.ts";
import type { TranslateBatch } from "./translate.ts";

export const DEFAULT_MODEL = "claude-opus-5-5";

// Models whose policy declines can be retried server-side on another model. Others stop
// with stop_reason "refusal", which fails the batch.
const MODELS_WITH_FALLBACK = new Set([
  "claude-fable-5-2",
  "claude-fable-5-1",
  "claude-opus-5-5",
  "claude-opus-5",
  "claude-sonnet-5-5",
]);

const ANSWER_SCHEMA = {
  type: "object",
  properties: {
    translations: {
      type: "array",
      items: {
        type: "object",
        properties: { key: { type: "string" }, translation: { type: "string" } },
        required: ["key", "translation"],
        additionalProperties: false,
      },
    },
  },
  required: ["translations"],
  additionalProperties: false,
};

const SYSTEM = `You translate the user interface of a small family web app from English.
Rules:
- Keep every $1, $2 … placeholder exactly as written, once each. $$ is a literal dollar sign.
- Keep the tone: friendly and short, never formal. Match the length of the English where you can.
- Use the glossary's terms. Answer with one translation for every key you were given, and no others.`;

const prompt = (request: Parameters<TranslateBatch>[0]): string => {
  const items = request.entries.map(({ key, english }) => ({
    key,
    english,
    // A named key is an identifier, not text: translate the English, keep the key.
    ...(isNamedKey(key) ? { note: "Named key: translate the English text." } : {}),
  }));
  return [
    `Target locale: ${request.locale}`,
    request.glossary ? `Glossary:\n${request.glossary}` : "",
    `Texts (JSON):\n${JSON.stringify(items, null, 2)}`,
  ]
    .filter(Boolean)
    .join("\n\n");
};

const isAnswer = (
  value: unknown,
): value is { translations: { key: string; translation: string }[] } =>
  typeof value === "object" &&
  value !== null &&
  "translations" in value &&
  Array.isArray(value.translations) &&
  value.translations.every(
    (item: unknown) =>
      typeof item === "object" &&
      item !== null &&
      "key" in item &&
      "translation" in item &&
      typeof item.key === "string" &&
      typeof item.translation === "string",
  );

/** A TranslateBatch that asks Claude, with the key and model from the environment. */
export const claudeTranslator = ({
  apiKey,
  model,
}: {
  apiKey: string;
  model: string;
}): TranslateBatch => {
  const client = new Anthropic({ apiKey });
  return async (request) => {
    const response = await client.beta.messages.create({
      model,
      max_tokens: 16000,
      system: SYSTEM,
      messages: [{ role: "user", content: prompt(request) }],
      output_config: { format: { type: "json_schema", schema: ANSWER_SCHEMA } },
      ...(MODELS_WITH_FALLBACK.has(model)
        ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const }
        : {}),
    });
    if (response.stop_reason !== "end_turn") {
      throw new Error(`${model} stopped with ${String(response.stop_reason)}`);
    }
    const text = response.content
      .flatMap((block) => (block.type === "text" ? [block.text] : []))
      .join("");
    const answer: unknown = JSON.parse(text);
    if (!isAnswer(answer)) throw new Error(`${model} answered in an unexpected shape`);
    return Object.fromEntries(
      answer.translations.map(({ key, translation }) => [key, translation]),
    );
  };
};
