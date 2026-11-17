import { component$, Slot, type PropsOf } from "@qwik.dev/core";
import { Icon } from "./icon.tsx";

export type ChipProps = Omit<PropsOf<"button">, "aria-pressed"> & {
  selected?: boolean;
};

/** A toggle for filters and choices. The selected state shows a check mark, not only colour. */
export const Chip = component$<ChipProps>(({ selected = false, class: className, ...rest }) => (
  <button {...rest} type="button" aria-pressed={selected} class={["wfd-chip", className]}>
    {selected && <Icon name="check" size={16} />}
    <Slot />
  </button>
));
