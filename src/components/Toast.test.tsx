import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ToastProvider, ToastViewport } from "./Toast";
import { useToast } from "@/hooks/use-toast";

afterEach(() => { cleanup(); vi.useRealTimers(); });
function Actions({ description, type = "success", timeout, prefix = "", onAction, request }: { description?: string; type?: string; timeout?: number; prefix?: string; onAction?: () => void; request?: Promise<void> }) {
  const toast = useToast();
  const id = useRef("");
  return <>
    <button onClick={() => { id.current = toast.add({ title: `${prefix}Salvo`, description, type, timeout, priority: type === "error" ? "high" : "low" }); }}>Notificar {prefix}</button>
    <button onClick={() => toast.update(id.current, { title: "Atualizado", type: "error", description: "Tente novamente" })}>Atualizar {prefix}</button>
    <button onClick={() => toast.close(id.current)}>Fechar {prefix}</button>
    <button onClick={() => toast.add({ id: "save", title: "Salvando", type: "loading" })}>Loading {prefix}</button>
    <button onClick={() => toast.add({ id: "save", title: "Salvo", type: "success" })}>Resultado {prefix}</button>
    <button onClick={() => toast.add({ title: "Falhou", type: "error", timeout: 0, actionProps: { children: "Tentar novamente", onClick: onAction } })}>Com ação</button>
    <button onClick={() => { if (request) void toast.promise(request, { loading: "Salvando", success: "Salvo", error: "Falhou" }).catch(() => {}); }}>Requisição</button>
  </>;
}
function setup(props: Parameters<typeof Actions>[0] = {}, providerTimeout = 5000) {
  return render(<ToastProvider timeout={providerTimeout}><Actions {...props} /><ToastViewport label="Avisos de produtos" align="end" /></ToastProvider>);
}
describe("Toast", () => {
  it("renders the message in the region supplied by the screen with an accessible close button", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Notificar" }));
    const toast = screen.getByRole("dialog", { name: "Salvo" });
    act(() => within(toast).getByLabelText("Fechar notificação").focus());
    expect(within(toast).getByRole("button", { name: "Fechar notificação" })).toBeInTheDocument();
    expect(toast.closest('[aria-label="Avisos de produtos"]')).not.toBeNull();
    expect(toast.querySelector(".lucide-check")).not.toBeNull();
  });
  it("supports errors with description and urgent announcement", () => {
    setup({ type: "error", description: "Verifique sua conexão." });
    fireEvent.click(screen.getByRole("button", { name: "Notificar" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Verifique sua conexão.");
    const toast = screen.getByRole("alertdialog", { hidden: true });
    act(() => toast.focus());
    expect(screen.getByRole("alertdialog", { name: "Salvo", description: "Verifique sua conexão." })).toBeInTheDocument();
    expect(toast.querySelector(".lucide-x")).not.toBeNull();
  });
  it("closes with the dismiss control", async () => {
    setup({ timeout: 0 });
    fireEvent.click(screen.getByRole("button", { name: "Notificar" }));
    await act(async () => fireEvent.click(screen.getByLabelText("Fechar notificação")));
    expect(screen.queryByRole("dialog", { name: "Salvo" })).not.toBeInTheDocument();
  });
  it("updates one notification instead of adding a second", () => {
    setup({ timeout: 0 });
    fireEvent.click(screen.getByRole("button", { name: "Notificar" }));
    fireEvent.click(screen.getByRole("button", { name: "Atualizar" }));
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(screen.getByRole("dialog", { name: "Atualizado", description: "Tente novamente" })).toBeInTheDocument();
  });
  it("upserts by id for loading and result without duplicated messages", () => {
    setup({ timeout: 0 });
    fireEvent.click(screen.getByRole("button", { name: "Loading" }));
    expect(screen.getByRole("dialog", { name: "Salvando" }).querySelector(".lucide-loader-circle")).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Resultado" }));
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(screen.getByRole("dialog", { name: "Salvo" }).querySelector(".lucide-check")).not.toBeNull();
  });
  it("isolates notification state between screens/regions", () => {
    render(<>
      <ToastProvider><Actions prefix="produtos" /><ToastViewport label="Produtos" /></ToastProvider>
      <ToastProvider><Actions prefix="perfil" /><ToastViewport label="Perfil" /></ToastProvider>
    </>);
    fireEvent.click(screen.getByRole("button", { name: "Notificar produtos" }));
    expect(screen.getByRole("dialog", { name: "produtosSalvo" }).closest('[aria-label="Produtos"]')).not.toBeNull();
    expect(screen.queryByRole("dialog", { name: "perfilSalvo" })).not.toBeInTheDocument();
  });
  it("removes screen notifications on unmount", () => {
    const { unmount } = setup({ timeout: 0 });
    fireEvent.click(screen.getByRole("button", { name: "Notificar" }));
    unmount();
    setup({ timeout: 0 });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("expires with the provider's timeout", async () => {
    setup({}, 80);
    fireEvent.click(screen.getByRole("button", { name: "Notificar" }));
    expect(screen.getByRole("dialog", { name: "Salvo" })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
  it("preserves a persistent notification until explicitly closed", async () => {
    setup({ timeout: 0 }, 40);
    fireEvent.click(screen.getByRole("button", { name: "Notificar" }));
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 80)); });
    expect(screen.getByRole("dialog", { name: "Salvo" })).toBeInTheDocument();
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Fechar" })));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("pauses expiration while the user focuses the close control", async () => {
    setup({}, 80);
    fireEvent.click(screen.getByRole("button", { name: "Notificar" }));
    act(() => screen.getByLabelText("Fechar notificação").focus());
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 120)); });
    expect(screen.getByRole("dialog", { name: "Salvo" })).toBeInTheDocument();
    act(() => screen.getByRole("button", { name: "Notificar" }).focus());
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
  it("forwards an optional recovery action without automatically retrying", () => {
    const onAction = vi.fn();
    setup({ onAction });
    fireEvent.click(screen.getByRole("button", { name: "Com ação" }));
    expect(onAction).not.toHaveBeenCalled();
    act(() => screen.getByText("Tentar novamente").focus());
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(onAction).toHaveBeenCalledOnce();
  });
  it.each([true, false])("updates a request's loading message in place on success=%s", async success => {
    let resolve!: () => void;
    let reject!: (reason: Error) => void;
    const request = new Promise<void>((yes, no) => { resolve = yes; reject = no; });
    setup({ request });
    fireEvent.click(screen.getByRole("button", { name: "Requisição" }));
    expect(screen.getByRole("dialog", { description: "Salvando" })).toHaveAttribute("aria-busy", "true");
    await act(async () => { if (success) resolve(); else reject(new Error("offline")); });
    const toast = screen.getByRole("dialog", { description: success ? "Salvo" : "Falhou" });
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(toast.querySelector(".lucide-loader-circle")).toBeNull();
    expect(toast).not.toHaveAttribute("aria-busy");
  });
});
