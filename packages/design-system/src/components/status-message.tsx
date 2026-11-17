import { component$, Slot } from "@qwik.dev/core";
import { Icon, type IconName } from "./icon.tsx";
import { Logo } from "./logo.tsx";

export type StatusMessageProps = {
  title: string;
  /** A decorative icon. Without one, the logo mark is shown (brief section 10). */
  icon?: IconName;
  /** 1 when the message is the whole page (a 404 page), 2 or 3 inside a page. */
  level?: 1 | 2 | 3;
};

/**
 * A centred message for a page or section with nothing to show: not found, empty,
 * error or offline. The body goes in the default slot, and a button or link in the
 * "action" slot.
 */
export const StatusMessage = component$<StatusMessageProps>(({ title, icon, level = 2 }) => {
  const Heading = `h${String(level)}` as "h2";
  return (
    <div class="wfd-status">
      <span class="wfd-status__visual">
        {icon ? <Icon name={icon} /> : <Logo variant="mark" height={40} decorative />}
      </span>
      <Heading class="wfd-status__title">{title}</Heading>
      <div class="wfd-status__body">
        <Slot />
      </div>
      <div class="wfd-status__action">
        <Slot name="action" />
      </div>
    </div>
  );
});
