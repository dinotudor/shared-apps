import { component$, Slot, useSignal, useVisibleTask$, type Signal } from "@qwik.dev/core";
import { Icon } from "./icon.tsx";

export type ToastProps = {
  /** Shows the toast while true. The toast sets it to false when it closes. */
  open: Signal<boolean>;
  /** Milliseconds before it closes by itself. SkiroLiro asks for 5 to 8 s. */
  duration?: number;
  /**
   * Identifies the message shown. Change it when a new message replaces the current
   * one while the toast is open, so the new message gets its full duration.
   */
  messageId?: string | number;
};

/**
 * A short confirmation ("Prato salvo."). Errors that need action go in an Alert,
 * not a toast. The live region is always in the page, so screen readers announce
 * each new message.
 */
export const Toast = component$<ToastProps>((props) => {
  const { open } = props;
  // Paused while the pointer or focus is on the toast, so nobody loses it mid-read
  // (WCAG 2.2.1). Pointer and focus are tracked apart, so one leaving does not end
  // the pause while the other is still there. The timer restarts in full afterwards.
  const hovered = useSignal(false);
  const focused = useSignal(false);

  // A timer is browser-only work, so it runs in a visible task, not during SSR.
  // eslint-disable-next-line qwik/no-use-visible-task -- the timer must start without a user event
  useVisibleTask$(
    ({ track, cleanup }) => {
      const isOpen = track(open);
      const duration = track(() => props.duration ?? 6000);
      track(() => props.messageId);
      if (!isOpen) {
        // pointerleave and focusout never fire on a toast removed while hovered or
        // focused, so the pause is reset here for the next time it opens.
        hovered.value = false;
        focused.value = false;
        return;
      }
      if (track(hovered) || track(focused)) return;
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
            focused.value = true;
          }}
          onFocusOut$={() => {
            focused.value = false;
          }}
          onPointerEnter$={() => {
            hovered.value = true;
          }}
          onPointerLeave$={() => {
            hovered.value = false;
          }}
        >
          <div class="wfd-toast__message">
            <Slot />
          </div>
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
