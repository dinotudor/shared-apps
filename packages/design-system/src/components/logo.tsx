import { component$ } from "@qwik.dev/core";
import lockupDark from "../../brand/wfd-lockup-dark.svg?url";
import lockupLight from "../../brand/wfd-lockup-light.svg?url";
import markDark from "../../brand/wfd-mark-dark.svg?url";
import markLight from "../../brand/wfd-mark-light.svg?url";

const FILES = {
  mark: { light: markLight, dark: markDark, ratio: 1 },
  // The lockup files have a 1500 × 170 viewBox.
  lockup: { light: lockupLight, dark: lockupDark, ratio: 1500 / 170 },
} as const;

export type LogoProps = {
  /** `mark`: the face only (header, empty and loading states). `lockup`: face and name. */
  kind: "mark" | "lockup";
  /** Height in px. The header uses the 30 px default. */
  height?: number;
  /** Empty alt text, for when the app name is already visible next to the logo. */
  decorative?: boolean;
};

// Both versions are rendered; styles.css shows the one that matches the active theme
// (system preference or data-theme), the same rule the colour tokens follow.
export const Logo = component$<LogoProps>(({ kind, height = 30, decorative = false }) => {
  const files = FILES[kind];
  const width = Math.round(height * files.ratio);
  const alt = decorative ? "" : "What's for dinner?";
  return (
    <>
      {(["light", "dark"] as const).map((mode) => (
        <img
          key={mode}
          class={["wfd-logo", `wfd-logo--${mode}`]}
          src={files[mode]}
          alt={alt}
          width={width}
          height={height}
        />
      ))}
    </>
  );
});
