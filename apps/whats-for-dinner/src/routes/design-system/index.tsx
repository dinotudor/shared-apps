import { $, component$, isServer, useSignal, useTask$ } from "@qwik.dev/core";
import type { DocumentHead } from "@qwik.dev/router";
import {
  Alert,
  Avatar,
  BottomNav,
  BottomSheet,
  Button,
  Card,
  Checkbox,
  Chip,
  Dialog,
  ICON_NAMES,
  Icon,
  LoadingState,
  Logo,
  OfflineNotice,
  StatusMessage,
  TextArea,
  TextField,
  Toast,
  tokens,
  vars,
} from "@shared-apps/design-system";

const Theme = { Light: "light", System: "system", Dark: "dark" } as const;
type Theme = (typeof Theme)[keyof typeof Theme];

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: Theme.Light, label: "Light" },
  { value: Theme.System, label: "System" },
  { value: Theme.Dark, label: "Dark" },
];

const COLOUR_ROLES = Object.keys(tokens.color.light) as (keyof typeof vars.color)[];

// Every base component from brief section 10, for checking light and dark mode.
// The tokens switch theme through data-theme on <html> only, so the switch below
// changes the whole page.
export default component$(() => {
  const theme = useSignal<Theme>(Theme.System);
  const chipSelected = useSignal(true);
  const toastOpen = useSignal(false);
  const dialogOpen = useSignal(false);
  const sheetOpen = useSignal(false);

  // Runs again in the browser when the theme changes. data-theme lives outside this
  // route, so cleanup puts it back when the page is left.
  useTask$(({ track, cleanup }) => {
    const value = track(theme);
    if (isServer) return;
    const root = document.documentElement;
    if (value === Theme.System) root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", value);
    cleanup(() => {
      root.removeAttribute("data-theme");
    });
  });

  const closeDialog = $(() => {
    dialogOpen.value = false;
  });
  const closeSheet = $(() => {
    sheetOpen.value = false;
  });

  return (
    <div class="stack">
      <h1>Components</h1>

      <section class="stack" aria-labelledby="ds-theme">
        <h2 id="ds-theme">Theme</h2>
        <div class="row">
          {THEME_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              selected={theme.value === option.value}
              onClick$={() => {
                theme.value = option.value;
              }}
            >
              {option.label}
            </Chip>
          ))}
        </div>
      </section>

      <section class="stack" aria-labelledby="ds-colours">
        <h2 id="ds-colours">Colours</h2>
        <div class="icon-grid">
          {COLOUR_ROLES.map((role) => (
            <div key={role} class="swatch">
              <span class="swatch__colour" style={{ background: vars.color[role] }} />
              {role}
            </div>
          ))}
        </div>
      </section>

      <section class="stack" aria-labelledby="ds-logo">
        <h2 id="ds-logo">Logo</h2>
        <div class="row">
          <Logo variant="mark" height={56} />
          <Logo variant="lockup" height={30} />
        </div>
      </section>

      <section class="stack" aria-labelledby="ds-icons">
        <h2 id="ds-icons">Icons</h2>
        <div class="icon-grid">
          {ICON_NAMES.map((name) => (
            <div key={name}>
              <Icon name={name} />
              <code>{name}</code>
            </div>
          ))}
        </div>
        <div class="row">
          <Icon name="search" size={16} label="16 px" />
          <Icon name="search" size={20} label="20 px" />
          <Icon name="search" size={24} label="24 px" />
        </div>
      </section>

      <section class="stack" aria-labelledby="ds-buttons">
        <h2 id="ds-buttons">Buttons</h2>
        <div class="row">
          <Button icon="plus">Add dish</Button>
          <Button variant="secondary">Cancel</Button>
          <Button variant="text">Edit</Button>
          <Button variant="danger" icon="trash">
            Delete
          </Button>
          <Button disabled>Save</Button>
        </div>
      </section>

      <section class="stack" aria-labelledby="ds-card">
        <h2 id="ds-card">Card and Chip</h2>
        <Card as="article">
          <p>Rice, beans and steak with onions.</p>
          <div class="row">
            <Chip
              selected={chipSelected.value}
              onClick$={() => {
                chipSelected.value = !chipSelected.value;
              }}
            >
              Vegetariano
            </Chip>
            <Chip>Quick</Chip>
          </div>
        </Card>
      </section>

      <section class="stack" aria-labelledby="ds-form">
        <h2 id="ds-form">Form</h2>
        <Checkbox label="Onion" hint="2" checked />
        <Checkbox label="Garlic" hint="1 head" />
        <Checkbox label="Coriander" disabled />
        <TextField label="Dish name" hint="What the family calls it." />
        <TextField label="Search" type="search" icon="search" />
        <TextField label="Prep time" error="Use numbers only." value="half an hour" />
        <TextArea label="Notes" />
      </section>

      <section class="stack" aria-labelledby="ds-avatar">
        <h2 id="ds-avatar">Avatar</h2>
        <div class="row">
          <Avatar name="Ana Souza" size={24} />
          <Avatar name="Ana Souza" size={32} />
          <Avatar name="Bruno Lima" size={40} />
          <Avatar name="Carla" size={56} />
        </div>
      </section>

      <section class="stack" aria-labelledby="ds-alerts">
        <h2 id="ds-alerts">Alerts and Toast</h2>
        <Alert variant="warning" title="Missing ingredient">
          Nobody bought onions.
        </Alert>
        <Alert variant="info">No connection. What you've already seen is still here.</Alert>
        <Alert variant="success">Dish saved.</Alert>
        <div class="row">
          <Button
            variant="secondary"
            onClick$={() => {
              toastOpen.value = true;
            }}
          >
            Show toast
          </Button>
        </div>
        <Toast open={toastOpen}>Dish saved.</Toast>
      </section>

      <section class="stack" aria-labelledby="ds-modals">
        <h2 id="ds-modals">Dialog and BottomSheet</h2>
        <div class="row">
          <Button
            variant="secondary"
            onClick$={() => {
              dialogOpen.value = true;
            }}
          >
            Open dialog
          </Button>
          <Button
            variant="secondary"
            onClick$={() => {
              sheetOpen.value = true;
            }}
          >
            Open bottom sheet
          </Button>
        </div>
        <Dialog open={dialogOpen} title="Delete Steak with onions?">
          The family's ratings go too. This can't be undone.
          <div q:slot="actions">
            <Button variant="secondary" onClick$={closeDialog}>
              Cancel
            </Button>
            <Button variant="danger" onClick$={closeDialog}>
              Delete
            </Button>
          </div>
        </Dialog>
        <BottomSheet open={sheetOpen} title="Plan the day">
          Pick a saved dish or leave the day open.
          <div q:slot="actions">
            <Button onClick$={closeSheet}>Choose a dish</Button>
          </div>
        </BottomSheet>
      </section>

      <section class="stack" aria-labelledby="ds-status">
        <h2 id="ds-status">StatusMessage</h2>
        <Card>
          <StatusMessage icon="search" title="Page not found" level={3}>
            This address doesn't exist or has changed.
            {/* A link with the button classes, the pattern the README recommends. */}
            <a q:slot="action" class="wfd-button wfd-button--secondary" href="/">
              Back to home
            </a>
          </StatusMessage>
        </Card>
        <Card>
          <StatusMessage title="No dishes yet" level={3}>
            The family hasn't saved any dishes yet. How about the first one?
          </StatusMessage>
        </Card>
        <Card>
          <StatusMessage icon="offline" title="No connection" level={3}>
            What you've already seen is still here.
          </StatusMessage>
        </Card>
      </section>

      <section class="stack" aria-labelledby="ds-states">
        <h2 id="ds-states">LoadingState and OfflineNotice</h2>
        <Card>
          <LoadingState />
        </Card>
        <OfflineNotice />
      </section>

      <section class="stack" aria-labelledby="ds-nav">
        <h2 id="ds-nav">BottomNav</h2>
        <BottomNav
          label="Navigation example"
          current="/dishes"
          items={[
            { href: "/", label: "Week", icon: "week" },
            { href: "/dishes", label: "Dishes", icon: "dishes" },
          ]}
        />
      </section>
    </div>
  );
});

export const head: DocumentHead = { title: "Components · What's for dinner?" };
