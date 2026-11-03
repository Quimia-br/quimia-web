import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { loadVLibras, setVLibrasVisible, showVLibras } from "@/lib/vlibras";

afterEach(() => {
  document.getElementById("quimia-vlibras-script")?.remove();
  document.getElementById("vlibras-app-root")?.remove();
  document.getElementById("vlibras-access-wrapper")?.remove();
  setVLibrasVisible(false);
  delete window.VLibrasWidget;
  vi.useRealTimers();
});

describe("official VLibras integration", () => {
  it("keeps a late launcher hidden and cancels opening after the user disables the tool", async () => {
    const opening = showVLibras();
    const cancelled = expect(opening).rejects.toMatchObject({ name: "AbortError" });
    setVLibrasVisible(false);
    const wrapper = document.createElement("div");
    wrapper.id = "vlibras-access-wrapper";
    document.body.append(wrapper);
    const open = vi.fn();
    window.VLibrasWidget = {
      initBtn: document.createElement("button"),
      access: document.createElement("div"),
      open,
    };
    document.getElementById("quimia-vlibras-script")!.dispatchEvent(new Event("load"));
    await cancelled;
    expect(open).not.toHaveBeenCalled();
    expect(wrapper.hidden).toBe(true);
  });

  it("reuses a single script and themes the official accessible button", async () => {
    const first = loadVLibras();
    const second = loadVLibras();
    expect(document.querySelectorAll("#quimia-vlibras-script")).toHaveLength(1);
    const button = document.createElement("button");
    const access = document.createElement("div");
    window.VLibrasWidget = { initBtn: button, access, open: vi.fn() };
    document.getElementById("quimia-vlibras-script")!.dispatchEvent(new Event("load"));
    await Promise.all([first, second]);
    expect(button).toHaveAccessibleName("Abrir tradutor de Libras — VLibras");
    expect(button.style.background).toBe("var(--primary-primary)");
  });

  it("rejects network failures and allows a new attempt", async () => {
    const first = loadVLibras();
    const rejected = expect(first).rejects.toThrow(/VLibras/);
    document.getElementById("quimia-vlibras-script")!.dispatchEvent(new Event("error"));
    await rejected;
    const retry = loadVLibras();
    window.VLibrasWidget = {
      initBtn: document.createElement("button"),
      access: document.createElement("div"),
      open: vi.fn(),
    };
    document.getElementById("quimia-vlibras-script")!.dispatchEvent(new Event("load"));
    await expect(retry).resolves.toBeDefined();
  });

  it("opens the actual translator before reporting success", async () => {
    const root = document.createElement("div");
    root.id = "vlibras-app-root";
    window.VLibrasWidget = {
      initBtn: document.createElement("button"),
      access: document.createElement("div"),
      open: () => {
        root.dataset.active = "true";
        document.body.append(root);
      },
    };
    await showVLibras();
    expect(root.dataset.active).toBe("true");
  });
});
