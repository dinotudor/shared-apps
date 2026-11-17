import { component$ } from "@qwik.dev/core";
import { DocumentHeadTags, RouterOutlet, useQwikRouter } from "@qwik.dev/router";
import appIcon from "@shared-apps/design-system/brand/wfd-app-icon.svg?url";
import touchIcon from "@shared-apps/design-system/brand/wfd-apple-touch-icon.png?url";
import "@shared-apps/design-system/styles.css";

export default component$(() => {
  useQwikRouter();

  return (
    <>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" type="image/svg+xml" href={appIcon} />
        {/* iOS ignores SVG icons for the home screen (brand/README.md). */}
        <link rel="apple-touch-icon" href={touchIcon} />
        <DocumentHeadTags />
      </head>
      <body>
        <RouterOutlet />
      </body>
    </>
  );
});
