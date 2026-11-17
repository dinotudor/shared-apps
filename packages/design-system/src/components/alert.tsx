import { component$, Slot } from "@qwik.dev/core";
import { Icon, type IconName } from "./icon.tsx";

export const AlertVariant = { Warning: "warning", Info: "info", Success: "success" } as const;
export type AlertVariant = (typeof AlertVariant)[keyof typeof AlertVariant];

// Each variant has its own icon, and the icon names it, so the meaning does not
// depend on colour.
const VARIANTS: Record<AlertVariant, { icon: IconName; label: string }> = {
  warning: { icon: "alert", label: "Atenção" },
  info: { icon: "info", label: "Informação" },
  success: { icon: "check", label: "Sucesso" },
};

export type AlertProps = {
  variant: AlertVariant;
  title?: string;
};

/** A persistent, inline message. For a transient confirmation use Toast. */
export const Alert = component$<AlertProps>(({ variant, title }) => (
  <div class={["wfd-alert", `wfd-alert--${variant}`]}>
    <Icon name={VARIANTS[variant].icon} size={20} label={VARIANTS[variant].label} />
    <div class="wfd-alert__content">
      {title && <p class="wfd-alert__title">{title}</p>}
      <div class="wfd-alert__body">
        <Slot />
      </div>
    </div>
  </div>
));
