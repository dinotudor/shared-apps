import { component$, Slot, type PropsOf } from "@qwik.dev/core";
import { Icon, type IconName } from "./icon.tsx";

export const ButtonVariant = {
  Primary: "primary",
  Secondary: "secondary",
  Text: "text",
  Danger: "danger",
} as const;
export type ButtonVariant = (typeof ButtonVariant)[keyof typeof ButtonVariant];

export type ButtonProps = PropsOf<"button"> & {
  /** primary: the one main action on a screen. danger: destructive, never the default. */
  variant?: ButtonVariant;
  /** Decorative icon before the label. */
  icon?: IconName;
};

export const Button = component$<ButtonProps>(
  ({ variant = "primary", icon, type = "button", class: className, ...rest }) => (
    <button {...rest} type={type} class={["wfd-button", `wfd-button--${variant}`, className]}>
      {icon && <Icon name={icon} size={20} />}
      <Slot />
    </button>
  ),
);
