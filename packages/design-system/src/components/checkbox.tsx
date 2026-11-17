import { component$, type QRL } from "@qwik.dev/core";
import { Icon } from "./icon.tsx";

export type CheckboxProps = {
  label: string;
  /** Secondary text at the end of the row, such as a quantity. */
  hint?: string;
  name?: string;
  value?: string;
  checked?: boolean;
  disabled?: boolean;
  onChange$?: QRL<(checked: boolean) => void>;
};

/** A native checkbox inside its label, so the whole row (at least 44 px) is the touch target. */
export const Checkbox = component$<CheckboxProps>(
  ({ label, hint, name, value, checked = false, disabled = false, onChange$ }) => (
    <label class="wfd-checkbox">
      <input
        class="wfd-checkbox__input"
        type="checkbox"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange$={(_, input) => onChange$?.(input.checked)}
      />
      <span class="wfd-checkbox__box" aria-hidden="true">
        <Icon name="check" size={16} />
      </span>
      <span class="wfd-checkbox__label">{label}</span>
      {hint && <small class="wfd-checkbox__hint">{hint}</small>}
    </label>
  ),
);
