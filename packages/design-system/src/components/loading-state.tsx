import { component$ } from "@qwik.dev/core";
import { useLabels } from "../labels.ts";
import { Logo } from "./logo.tsx";

export type LoadingStateProps = {
  /** What is being loaded. The default is labels.loading, the guide's copy. */
  label?: string;
  /** How many placeholder blocks to show below the label. */
  blocks?: number;
};

/**
 * A page or section waiting for data: the logo mark, a short label and placeholder
 * blocks (the guide's loading state). The label is a polite status, so screen
 * readers announce it once without interrupting; the blocks are decoration.
 */
export const LoadingState = component$<LoadingStateProps>(({ label, blocks = 2 }) => {
  const labels = useLabels();
  return (
    <div class="wfd-loading" role="status">
      <span class="wfd-loading__visual">
        <Logo variant="mark" height={40} decorative />
      </span>
      <p class="wfd-loading__label">{label ?? labels.loading}</p>
      <div class="wfd-loading__skeleton" aria-hidden="true">
        {Array.from({ length: blocks }, (_, index) => (
          <div key={index} class="wfd-skeleton" />
        ))}
      </div>
    </div>
  );
});
