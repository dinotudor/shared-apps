import { component$, useId, type PropsOf } from "@qwik.dev/core";
import { Icon, type IconName } from "./icon.tsx";

type FieldProps = {
  /** Always visible above the control. */
  label: string;
  /** Help text in muted colour below the control. */
  hint?: string;
  /** Shown below the hint with an icon. Also marks the control invalid. */
  error?: string;
};

type FieldIds = { control: string; hint?: string; error?: string };

const fieldIds = (base: string, { hint, error }: FieldProps): FieldIds => ({
  control: `${base}-control`,
  ...(hint ? { hint: `${base}-hint` } : {}),
  ...(error ? { error: `${base}-error` } : {}),
});

const describedBy = (ids: FieldIds): string | undefined =>
  [ids.hint, ids.error].filter(Boolean).join(" ") || undefined;

const Messages = ({ ids, hint, error }: { ids: FieldIds } & FieldProps) => (
  <>
    {hint && (
      <p id={ids.hint} class="wfd-field__hint">
        {hint}
      </p>
    )}
    {error && (
      <p id={ids.error} class="wfd-field__error">
        <Icon name="alert" size={16} />
        {error}
      </p>
    )}
  </>
);

export type TextFieldProps = Omit<PropsOf<"input">, "id" | "children"> &
  FieldProps & {
    /** Decorative icon inside the field, before the text (search). */
    icon?: IconName;
  };

export const TextField = component$<TextFieldProps>(
  ({ label, hint, error, icon, type = "text", class: className, ...rest }) => {
    const ids = fieldIds(useId(), { label, hint, error });
    return (
      <div class={["wfd-field", className]}>
        <label class="wfd-field__label" for={ids.control}>
          {label}
        </label>
        <div class="wfd-field__control">
          {icon && <Icon name={icon} size={20} />}
          <input
            {...rest}
            id={ids.control}
            type={type}
            class="wfd-field__input"
            aria-invalid={error ? "true" : undefined}
            aria-describedby={describedBy(ids)}
          />
        </div>
        <Messages ids={ids} label={label} hint={hint} error={error} />
      </div>
    );
  },
);

export type TextAreaProps = Omit<PropsOf<"textarea">, "id" | "children"> & FieldProps;

export const TextArea = component$<TextAreaProps>(
  ({ label, hint, error, rows = 3, class: className, ...rest }) => {
    const ids = fieldIds(useId(), { label, hint, error });
    return (
      <div class={["wfd-field", className]}>
        <label class="wfd-field__label" for={ids.control}>
          {label}
        </label>
        <textarea
          {...rest}
          id={ids.control}
          rows={rows}
          class="wfd-field__input wfd-field__input--multiline"
          aria-invalid={error ? "true" : undefined}
          aria-describedby={describedBy(ids)}
        />
        <Messages ids={ids} label={label} hint={hint} error={error} />
      </div>
    );
  },
);
