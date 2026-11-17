import { component$, Slot, useId, useSignal, useVisibleTask$, type Signal } from "@qwik.dev/core";
import { Icon } from "./icon.tsx";

export type ModalProps = {
  /** Shows the modal while true. Closing it (button, Esc) sets it to false. */
  open: Signal<boolean>;
  title: string;
};

type Placement = "center" | "bottom";

// The native <dialog> opened with showModal() gives focus trapping, Esc to close,
// an inert page behind it and focus return, without extra code.
const Modal = component$<ModalProps & { placement: Placement }>(({ open, title, placement }) => {
  const titleId = `${useId()}-title`;
  const dialog = useSignal<HTMLDialogElement>();

  // showModal() exists only in the browser, so this runs in a visible task.
  useVisibleTask$(
    ({ track }) => {
      const isOpen = track(open);
      const element = track(dialog);
      // The test DOM has no showModal.
      if (!element || typeof element.showModal !== "function") return;
      if (isOpen && !element.open) element.showModal();
      if (!isOpen && element.open) element.close();
    },
    { strategy: "document-ready" },
  );

  return (
    <dialog
      ref={dialog}
      class={["wfd-modal", `wfd-modal--${placement}`]}
      aria-labelledby={titleId}
      onClose$={() => {
        open.value = false;
      }}
    >
      <header class="wfd-modal__header">
        <h2 id={titleId} class="wfd-modal__title">
          {title}
        </h2>
        <button
          type="button"
          class="wfd-modal__close"
          aria-label="Fechar"
          onClick$={() => {
            open.value = false;
          }}
        >
          <Icon name="close" size={20} />
        </button>
      </header>
      <div class="wfd-modal__body">
        <Slot />
      </div>
      <div class="wfd-modal__actions">
        <Slot name="actions" />
      </div>
    </dialog>
  );
});

/** A centred modal. One title, short text, up to two actions in the `actions` slot. */
export const Dialog = component$<ModalProps>((props) => (
  <Modal {...props} placement="center">
    <Slot />
    <Slot name="actions" q:slot="actions" />
  </Modal>
));

/** A modal that rises from the bottom edge. Preferred over Dialog on phones for choices. */
export const BottomSheet = component$<ModalProps>((props) => (
  <Modal {...props} placement="bottom">
    <Slot />
    <Slot name="actions" q:slot="actions" />
  </Modal>
));
