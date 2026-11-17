# What's for dinner? logo, v0 approved

Approved by Dino on 2026-11-08. Direction G1: a hand-drawn thinking face (mint face, big white eyes, one raised eyebrow, straight mouth). It is a v0, to be refined later.

| File | Use |
|---|---|
| `wfd-lockup-light.svg` / `wfd-lockup-dark.svg` | Mark with the name, on light and dark backgrounds |
| `wfd-mark-light.svg` / `wfd-mark-dark.svg` | The face only, for avatar and favicon |
| `wfd-app-icon.svg` | App icon (1024 px, navy background) |
| `wfd-apple-touch-icon.png` | iOS home-screen icon, 180 px, generated from `wfd-app-icon.svg` |

The name is set in Figtree Bold, converted to outlines. SkiroLiro colours (mint `#2DB88C` / `#4FE0B0`, navy `#16335E`). Original drawing, no third-party licence.

## Regenerating the iOS icon

iOS ignores SVG touch icons and fills transparent corners with black, so `wfd-apple-touch-icon.png` is a square-cornered PNG (iOS rounds it). After changing `wfd-app-icon.svg`, regenerate it on macOS with the built-in tools, from this folder:

```sh
sed 's#rx="224" ##' wfd-app-icon.svg > /tmp/wfd-square.svg   # drop the rounded corners
qlmanage -t -s 180 -o /tmp /tmp/wfd-square.svg
cp /tmp/wfd-square.svg.png wfd-apple-touch-icon.png
```

Check that the result is 180 × 180 with square navy corners.
