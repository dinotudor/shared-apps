import { component$, useSignal } from "@qwik.dev/core";
import { describe, expect, it } from "vitest";
import { BottomSheet, Button, Dialog } from "../src/index.ts";
import { get, render } from "./render.ts";

const Harness = component$<{ kind: "dialog" | "sheet" }>(({ kind }) => {
  const open = useSignal(true);
  const Modal = kind === "dialog" ? Dialog : BottomSheet;
  return (
    <div data-open={String(open.value)}>
      <Modal open={open} title="Excluir Feijoada?">
        As notas da família também somem. Não dá para desfazer.
        <div q:slot="actions">
          <Button variant="secondary">Cancelar</Button>
          <Button variant="danger">Excluir</Button>
        </div>
      </Modal>
    </div>
  );
});

describe.each([
  ["Dialog", "dialog", "center"],
  ["BottomSheet", "sheet", "bottom"],
] as const)("%s", (_, kind, placement) => {
  it("renders a native dialog labelled by its title", async () => {
    const { screen } = await render(<Harness kind={kind} />);
    const dialog = get(screen, "dialog.wfd-modal");
    expect(dialog.classList.contains(`wfd-modal--${placement}`)).toBe(true);
    const title = get(dialog, `#${dialog.getAttribute("aria-labelledby")}`);
    expect(title.textContent).toBe("Excluir Feijoada?");
    expect(get(dialog, ".wfd-modal__body").textContent).toContain("Não dá para desfazer.");
    expect(get(dialog, ".wfd-modal__actions").textContent).toBe("CancelarExcluir");
  });

  it("closes from its close button", async () => {
    const { screen, userEvent } = await render(<Harness kind={kind} />);
    const close = get(screen, ".wfd-modal__close");
    expect(close.getAttribute("aria-label")).toBe("Fechar");
    await userEvent(close, "click");
    expect(get(screen, "[data-open]").getAttribute("data-open")).toBe("false");
  });

  it("syncs the open signal when the browser closes it (Esc)", async () => {
    const { screen, userEvent } = await render(<Harness kind={kind} />);
    await userEvent(get(screen, "dialog"), "close");
    expect(get(screen, "[data-open]").getAttribute("data-open")).toBe("false");
  });
});
