import { $, component$, isServer, useSignal, useTask$ } from "@qwik.dev/core";
import type { DocumentHead } from "@qwik.dev/router";
import { _ } from "compiled-i18n";
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

// A function so the labels are translated per render (see navItems in navigation.ts).
const themeOptions = (): { value: Theme; label: string }[] => [
  { value: Theme.Light, label: _`Light` },
  { value: Theme.System, label: _`System` },
  { value: Theme.Dark, label: _`Dark` },
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
      <h1>{_`Components`}</h1>

      <section class="stack" aria-labelledby="ds-theme">
        <h2 id="ds-theme">{_`Theme`}</h2>
        <div class="row">
          {themeOptions().map((option) => (
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
        <h2 id="ds-colours">{_`Colours`}</h2>
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
        <h2 id="ds-logo">{_`Logo`}</h2>
        <div class="row">
          <Logo variant="mark" height={56} />
          <Logo variant="lockup" height={30} />
        </div>
      </section>

      <section class="stack" aria-labelledby="ds-icons">
        <h2 id="ds-icons">{_`Icons`}</h2>
        <div class="icon-grid">
          {ICON_NAMES.map((name) => (
            <div key={name}>
              <Icon name={name} />
              <code>{name}</code>
            </div>
          ))}
        </div>
        <div class="row">
          <Icon name="search" size={16} label={_`${16} px`} />
          <Icon name="search" size={20} label={_`${20} px`} />
          <Icon name="search" size={24} label={_`${24} px`} />
        </div>
      </section>

      <section class="stack" aria-labelledby="ds-buttons">
        <h2 id="ds-buttons">{_`Buttons`}</h2>
        <div class="row">
          <Button icon="plus">{_`Add dish`}</Button>
          <Button variant="secondary">{_`Cancel`}</Button>
          <Button variant="text">{_`Edit`}</Button>
          <Button variant="danger" icon="trash">
            {_`Delete`}
          </Button>
          <Button disabled>{_`Save`}</Button>
        </div>
      </section>

      <section class="stack" aria-labelledby="ds-card">
        <h2 id="ds-card">{_`Card and Chip`}</h2>
        <Card as="article">
          <p>{_`Rice, beans and steak with onions.`}</p>
          <div class="row">
            <Chip
              selected={chipSelected.value}
              onClick$={() => {
                chipSelected.value = !chipSelected.value;
              }}
            >
              {_`Vegetarian`}
            </Chip>
            <Chip>{_`Quick`}</Chip>
          </div>
        </Card>
      </section>

      <section class="stack" aria-labelledby="ds-form">
        <h2 id="ds-form">{_`Form`}</h2>
        <Checkbox label={_`Onion`} hint="2" checked />
        <Checkbox label={_`Garlic`} hint={_`${1} head`} />
        <Checkbox label={_`Coriander`} disabled />
        <TextField label={_`Dish name`} hint={_`What the family calls it.`} />
        <TextField label={_`Search`} type="search" icon="search" />
        <TextField label={_`Prep time`} error={_`Use numbers only.`} value={_`half an hour`} />
        <TextArea label={_`Notes`} />
      </section>

      <section class="stack" aria-labelledby="ds-avatar">
        <h2 id="ds-avatar">{_`Avatar`}</h2>
        <div class="row">
          <Avatar name="Ana Souza" size={24} />
          <Avatar name="Ana Souza" size={32} />
          <Avatar name="Bruno Lima" size={40} />
          <Avatar name="Carla" size={56} />
        </div>
      </section>

      <section class="stack" aria-labelledby="ds-alerts">
        <h2 id="ds-alerts">{_`Alerts and Toast`}</h2>
        <Alert variant="warning" title={_`Missing ingredient`}>
          {_`Nobody bought onions.`}
        </Alert>
        <Alert variant="info">{_`No connection. What you've already seen is still here.`}</Alert>
        <Alert variant="success">{_`Dish saved.`}</Alert>
        <div class="row">
          <Button
            variant="secondary"
            onClick$={() => {
              toastOpen.value = true;
            }}
          >
            {_`Show toast`}
          </Button>
        </div>
        <Toast open={toastOpen}>{_`Dish saved.`}</Toast>
      </section>

      <section class="stack" aria-labelledby="ds-modals">
        <h2 id="ds-modals">{_`Dialog and BottomSheet`}</h2>
        <div class="row">
          <Button
            variant="secondary"
            onClick$={() => {
              dialogOpen.value = true;
            }}
          >
            {_`Open dialog`}
          </Button>
          <Button
            variant="secondary"
            onClick$={() => {
              sheetOpen.value = true;
            }}
          >
            {_`Open bottom sheet`}
          </Button>
        </div>
        <Dialog open={dialogOpen} title={_`Delete ${_`Steak with onions`}?`}>
          {_`The family's ratings go too. This can't be undone.`}
          <div q:slot="actions">
            <Button variant="secondary" onClick$={closeDialog}>
              {_`Cancel`}
            </Button>
            <Button variant="danger" onClick$={closeDialog}>
              {_`Delete`}
            </Button>
          </div>
        </Dialog>
        <BottomSheet open={sheetOpen} title={_`Plan the day`}>
          {_`Pick a saved dish or leave the day open.`}
          <div q:slot="actions">
            <Button onClick$={closeSheet}>{_`Choose a dish`}</Button>
          </div>
        </BottomSheet>
      </section>

      <section class="stack" aria-labelledby="ds-status">
        <h2 id="ds-status">{_`StatusMessage`}</h2>
        <Card>
          <StatusMessage icon="search" title={_`Page not found`} level={3}>
            {_`This address doesn't exist or has changed.`}
            {/* A link with the button classes, the pattern the README recommends. */}
            <a q:slot="action" class="wfd-button wfd-button--secondary" href="/">
              {_`Back to home`}
            </a>
          </StatusMessage>
        </Card>
        <Card>
          <StatusMessage title={_`No dishes yet`} level={3}>
            {_`The family hasn't saved any dishes yet. How about the first one?`}
          </StatusMessage>
        </Card>
        <Card>
          <StatusMessage icon="offline" title={_`No connection`} level={3}>
            {_`What you've already seen is still here.`}
          </StatusMessage>
        </Card>
      </section>

      <section class="stack" aria-labelledby="ds-states">
        <h2 id="ds-states">{_`LoadingState and OfflineNotice`}</h2>
        <Card>
          <LoadingState />
        </Card>
        <OfflineNotice />
      </section>

      <section class="stack" aria-labelledby="ds-nav">
        <h2 id="ds-nav">{_`BottomNav`}</h2>
        <BottomNav
          label={_`Navigation example`}
          current="/dishes"
          items={[
            { href: "/", label: _`Week`, icon: "week" },
            { href: "/dishes", label: _`Dishes`, icon: "dishes" },
          ]}
        />
      </section>
    </div>
  );
});

export const head: DocumentHead = () => ({ title: _`Components · What's for dinner?` });
