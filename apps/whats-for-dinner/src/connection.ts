import {
  createContextId,
  useComputed$,
  useContext,
  useContextProvider,
  useSignal,
  useVisibleTask$,
} from "@qwik.dev/core";
import type { Signal } from "@qwik.dev/core";

type ConnectionSource = Pick<EventTarget, "addEventListener" | "removeEventListener"> & {
  navigator: { onLine: boolean };
};

/**
 * Calls `onChange` with the current connection state, then each time it changes.
 * Returns a function that stops watching.
 */
export const watchConnection = (
  source: ConnectionSource,
  onChange: (online: boolean) => void,
): (() => void) => {
  const update = (event: Event) => {
    onChange(event.type === "online");
  };
  onChange(source.navigator.onLine);
  source.addEventListener("online", update);
  source.addEventListener("offline", update);
  return () => {
    source.removeEventListener("online", update);
    source.removeEventListener("offline", update);
  };
};

const OnlineContext = createContextId<Signal<boolean>>("wfd.online");

/**
 * Tracks the connection for the whole app. The layout calls it once. The server renders
 * as online; the browser corrects it once the page is idle.
 *
 * It also sets `data-offline` on <html>, which CSS uses to show the offline notice.
 * Re-rendering through the signal would need to fetch code, and that fails offline;
 * this task's code is already loaded, so the attribute always works.
 */
export const useConnectionProvider = (): Readonly<Signal<boolean>> => {
  const online = useSignal(true);
  useContextProvider(OnlineContext, online);
  useVisibleTask$(
    ({ cleanup }) => {
      cleanup(
        watchConnection(window, (value) => {
          document.documentElement.toggleAttribute("data-offline", !value);
          online.value = value;
        }),
      );
    },
    { strategy: "document-idle" },
  );
  return online;
};

/**
 * True while offline. Screens use it to disable actions that need the API, so what
 * is on screen stays readable but can't be changed (brief section 10).
 */
export const useReadOnly = (): Readonly<Signal<boolean>> => {
  const online = useContext(OnlineContext);
  return useComputed$(() => !online.value);
};
