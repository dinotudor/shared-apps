import { component$ } from "@qwik.dev/core";
import { Icon } from "./icon.tsx";

/**
 * Shown while the device has no connection. The copy comes from brief section 10 and has
 * no humour. It looks like a warning Alert with the offline icon.
 *
 * Render it inside a live region (role="status") that is already on the page, so screen
 * readers announce it when it appears: a region inserted with its content is often missed.
 */
export const OfflineNotice = component$(() => (
  <div class="wfd-alert wfd-alert--warning">
    <Icon name="offline" size={20} />
    <div class="wfd-alert__content">
      <p class="wfd-alert__title">No connection.</p>
      <div class="wfd-alert__body">What you've already seen is still here.</div>
    </div>
  </div>
));
