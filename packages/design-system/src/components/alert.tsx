import { component$, Slot } from "@qwik.dev/core";
import { Icon, type IconName } from "./icon.tsx";

export const AlertTone = { Warning: "warning", Info: "info", Success: "success" } as const;
export type AlertTone = (typeof AlertTone)[keyof typeof AlertTone];

// Each tone has its own icon, and the icon names the tone, so the meaning does not
// depend on colour.
const TONES: Record<AlertTone, { icon: IconName; label: string }> = {
  warning: { icon: "alert", label: "Atenção" },
  info: { icon: "info", label: "Informação" },
  success: { icon: "check", label: "Sucesso" },
};

export type AlertProps = {
  tone: AlertTone;
  title?: string;
};

/** A persistent, inline message. For a transient confirmation use Toast. */
export const Alert = component$<AlertProps>(({ tone, title }) => (
  <div class={["wfd-alert", `wfd-alert--${tone}`]}>
    <Icon name={TONES[tone].icon} size={20} label={TONES[tone].label} />
    <div class="wfd-alert__content">
      {title && <p class="wfd-alert__title">{title}</p>}
      <p class="wfd-alert__body">
        <Slot />
      </p>
    </div>
  </div>
));
