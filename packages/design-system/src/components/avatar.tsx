import { component$ } from "@qwik.dev/core";

export type AvatarProps = {
  /** The person's name: the accessible name and the source of the initials. */
  name: string;
  size?: 24 | 32 | 40 | 56;
  /** Photo URL. Without one, the initials are shown. */
  src?: string;
};

/** First letter of the first and last words, so "Ana Maria Souza" → "AS". */
const initialsOf = (name: string): string => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0]?.[0] ?? "";
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? "") : "";
  return (first + last).toLocaleUpperCase("pt-BR");
};

export const Avatar = component$<AvatarProps>(({ name, size = 32, src }) =>
  src ? (
    <span class={["wfd-avatar", `wfd-avatar--${String(size)}`]}>
      <img src={src} alt={name} width={size} height={size} />
    </span>
  ) : (
    <span class={["wfd-avatar", `wfd-avatar--${String(size)}`]} role="img" aria-label={name}>
      {initialsOf(name)}
    </span>
  ),
);
