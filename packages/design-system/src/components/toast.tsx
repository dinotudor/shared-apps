import { component$, Slot, useSignal, useVisibleTask$, type Signal } from "@qwik.dev/core";
import { Icon } from "./icon.tsx";

export type ToastProps = {
  /** Shows the toast while true. The toast sets it to false when it closes. */
  open: Signal<boolean>;
  /** Milliseconds before it closes by itself. SkiroLiro asks for 5 to 8 s. */
  duration?: number;
};

/**
 * A short confirmation ("Prato salvo."). Errors that need action go in an Alert,
 * not a toast. The live region is always in the page, so screen readers announce
 * each new message.
 */
export const Toast = component$<ToastProps>(({ open, duration = 6000 }) => {
  // Paused while the pointer or focus is on the toast, so nobody loses it mid-read
  // (WCAG 2.2.1). The timer restarts in full when the pause ends.
  const paused = useSignal(false);

  // A timer is browser-only work, so it runs in a visible task, not during SSR.
  useVisibleTask$(
    ({ track, cleanup }) => {
      if (!track(open) || track(paused)) return;
      const timer = setTimeout(() => {
        open.value = false;
      }, duration);
      cleanup(() => {
        clearTimeout(timer);
      });
    },
    { strategy: "document-ready" },
  );

  return (
    <div class="wfd-toast-region" role="status">
      {open.value && (
        <div
          class="wfd-toast"
          onFocusIn$={() => {
            paused.value = true;
          }}
          onFocusOut$={() => {
            paused.value = false;
          }}
          onPointerEnter$={() => {
            paused.value = true;
          }}
          onPointerLeave$={() => {
            paused.value = false;
          }}
        >
          <p class="wfd-toast__message">
            <Slot />
          </p>
          <button
            type="button"
            class="wfd-toast__close"
            aria-label="Fechar"
            onClick$={() => {
              open.value = false;
            }}
          >
            <Icon name="close" size={20} />
          </button>
        </div>
      )}
    </div>
  );
});
