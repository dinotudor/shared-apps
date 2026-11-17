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
  Logo,
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
  { value: Theme.Light, label: "Claro" },
  { value: Theme.System, label: "Sistema" },
  { value: Theme.Dark, label: "Escuro" },
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
      <h1>Componentes</h1>

      <section class="stack" aria-labelledby="ds-theme">
        <h2 id="ds-theme">Tema</h2>
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
        <h2 id="ds-colours">Cores</h2>
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
        <h2 id="ds-icons">Ícones</h2>
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
        <h2 id="ds-buttons">Botões</h2>
        <div class="row">
          <Button icon="plus">Adicionar prato</Button>
          <Button variant="secondary">Cancelar</Button>
          <Button variant="text">Editar</Button>
          <Button variant="danger" icon="trash">
            Excluir
          </Button>
          <Button disabled>Salvar</Button>
        </div>
      </section>

      <section class="stack" aria-labelledby="ds-card">
        <h2 id="ds-card">Card e Chip</h2>
        <Card as="article">
          <p>Arroz, feijão e bife acebolado.</p>
          <div class="row">
            <Chip
              selected={chipSelected.value}
              onClick$={() => {
                chipSelected.value = !chipSelected.value;
              }}
            >
              Vegetariano
            </Chip>
            <Chip>Rápido</Chip>
          </div>
        </Card>
      </section>

      <section class="stack" aria-labelledby="ds-form">
        <h2 id="ds-form">Formulário</h2>
        <Checkbox label="Cebola" hint="2 un." checked />
        <Checkbox label="Alho" hint="1 cabeça" />
        <Checkbox label="Coentro" disabled />
        <TextField label="Nome do prato" hint="Como a família chama." />
        <TextField label="Buscar" type="search" icon="search" />
        <TextField label="Tempo de preparo" error="Use só números." value="meia hora" />
        <TextArea label="Observações" />
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
        <h2 id="ds-alerts">Alertas e Toast</h2>
        <Alert variant="warning" title="Falta ingrediente">
          Ninguém comprou cebola.
        </Alert>
        <Alert variant="info">Sem conexão. O que você já viu continua aqui.</Alert>
        <Alert variant="success">Prato salvo.</Alert>
        <div class="row">
          <Button
            variant="secondary"
            onClick$={() => {
              toastOpen.value = true;
            }}
          >
            Mostrar toast
          </Button>
        </div>
        <Toast open={toastOpen}>Prato salvo.</Toast>
      </section>

      <section class="stack" aria-labelledby="ds-modals">
        <h2 id="ds-modals">Dialog e BottomSheet</h2>
        <div class="row">
          <Button
            variant="secondary"
            onClick$={() => {
              dialogOpen.value = true;
            }}
          >
            Abrir dialog
          </Button>
          <Button
            variant="secondary"
            onClick$={() => {
              sheetOpen.value = true;
            }}
          >
            Abrir bottom sheet
          </Button>
        </div>
        <Dialog open={dialogOpen} title="Excluir Bife acebolado?">
          As notas da família também somem. Não dá para desfazer.
          <div q:slot="actions">
            <Button variant="secondary" onClick$={closeDialog}>
              Cancelar
            </Button>
            <Button variant="danger" onClick$={closeDialog}>
              Excluir
            </Button>
          </div>
        </Dialog>
        <BottomSheet open={sheetOpen} title="Planejar o dia">
          Escolha um prato salvo ou deixe livre.
          <div q:slot="actions">
            <Button onClick$={closeSheet}>Escolher prato</Button>
          </div>
        </BottomSheet>
      </section>

      <section class="stack" aria-labelledby="ds-status">
        <h2 id="ds-status">StatusMessage</h2>
        <Card>
          <StatusMessage icon="search" title="Página não encontrada" level={3}>
            Este endereço não existe ou mudou.
            {/* A link with the button classes, the pattern the README recommends. */}
            <a q:slot="action" class="wfd-button wfd-button--secondary" href="/">
              Voltar ao início
            </a>
          </StatusMessage>
        </Card>
        <Card>
          <StatusMessage title="Nenhum prato ainda" level={3}>
            A família ainda não salvou nenhum prato. Que tal o primeiro?
          </StatusMessage>
        </Card>
        <Card>
          <StatusMessage icon="offline" title="Sem conexão" level={3}>
            O que você já viu continua aqui.
          </StatusMessage>
        </Card>
      </section>

      <section class="stack" aria-labelledby="ds-nav">
        <h2 id="ds-nav">BottomNav</h2>
        <BottomNav
          label="Exemplo de navegação"
          current="/pratos"
          items={[
            { href: "/", label: "Semana", icon: "week" },
            { href: "/pratos", label: "Pratos", icon: "dishes" },
          ]}
        />
      </section>
    </div>
  );
});

export const head: DocumentHead = { title: "Componentes · What's for dinner?" };
