import { component$, Slot } from "@qwik.dev/core";

export type CardProps = {
  /** Use `article` for a self-contained item (a dish), `section` for a titled group. */
  as?: "div" | "article" | "section";
  class?: string;
};

export const Card = component$<CardProps>(({ as: Tag = "div", class: className }) => (
  <Tag class={["wfd-card", className]}>
    <Slot />
  </Tag>
));
