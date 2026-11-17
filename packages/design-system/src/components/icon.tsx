import { component$ } from "@qwik.dev/core";
import spriteUrl from "../icons/sprite.svg?url";

// Matches the `i-*` symbols in icons/sprite.svg (a test keeps them in sync).
// The last five are for Phase 2.
export const ICON_NAMES = [
  "week",
  "dishes",
  "back",
  "forward",
  "plus",
  "search",
  "sort",
  "camera",
  "image",
  "edit",
  "trash",
  "check",
  "close",
  "undo",
  "share",
  "person",
  "family",
  "skip",
  "freestyle",
  "saved-dish",
  "missing-ingredient",
  "alert",
  "info",
  "offline",
  "pot",
  "ingredient",
  "clock",
  "star",
  "month",
  "message",
  "stats",
  "shopping-list",
  "sticker",
] as const;

export type IconName = (typeof ICON_NAMES)[number];

export type IconProps = {
  name: IconName;
  /** 16, 20 or 24 px (brief section 10). */
  size?: 16 | 20 | 24;
  /** Makes the icon announce itself. Leave it out when visible text sits next to the icon. */
  label?: string;
  class?: string;
};

export const Icon = component$<IconProps>(({ name, size = 24, label, class: className }) => (
  <svg
    class={["wfd-icon", className]}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": "true" })}
  >
    <use href={`${spriteUrl}#i-${name}`} />
  </svg>
));
