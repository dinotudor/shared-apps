import { component$ } from "@qwik.dev/core";
import { Logo } from "./logo.tsx";

export type LoadingStateProps = {
  /** What is being loaded. The default is the guide's copy. */
  label?: string;
  /** How many placeholder blocks to show below the label. */
  blocks?: number;
};

/**
 * A page or section waiting for data: the logo mark, a short label and placeholder
 * blocks (the guide's "Carregando" state). The label is a polite status, so screen
 * readers announce it once without interrupting; the blocks are decoration.
 */
export const LoadingState = component$<LoadingStateProps>(
  ({ label = "Pensando no jantar…", blocks = 2 }) => (
    <div class="wfd-loading" role="status">
      <span class="wfd-loading__visual">
        <Logo variant="mark" height={40} decorative />
      </span>
      <p class="wfd-loading__label">{label}</p>
      <div class="wfd-loading__skeleton" aria-hidden="true">
        {Array.from({ length: blocks }, (_, index) => (
          <div key={index} class="wfd-skeleton" />
        ))}
      </div>
    </div>
  ),
);
