import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import GazeNavigation from "@/components/accessibility/GazeNavigation";
import { startTracking } from "@/lib/gaze/tracking";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { targetAt } from "@/lib/gaze/targets";

// jsdom has no camera, WASM canvas or worker. Camera cleanup is tested separately with real openCamera.
vi.mock("@/lib/gaze/tracking", () => ({ startTracking: vi.fn() }));

beforeEach(() => {
  vi.stubGlobal("matchMedia", (media: string) => ({
    matches: false,
    media,
    addEventListener() {},
    removeEventListener() {},
  }));
  vi.mocked(startTracking).mockReset();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  Reflect.deleteProperty(document, "elementFromPoint");
});

describe("eye navigation activation", () => {
  it("does not resume by dwelling on the same pause button without looking away", async () => {
    let receive!: (features: number[] | null) => void;
    vi.mocked(startTracking).mockImplementation(async (_signal, callback) => {
      receive = callback;
      return { stop() {} };
    });
    let now = 1000;
    vi.spyOn(performance, "now").mockImplementation(() => now);
    render(<GazeNavigation onClose={() => {}} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Permitir câmera e calibrar" }));
    });
    const targets = [
      [0.5, 0.5],
      [0.1, 0.1],
      [0.5, 0.1],
      [0.9, 0.1],
      [0.9, 0.5],
      [0.9, 0.9],
      [0.5, 0.9],
      [0.1, 0.9],
      [0.1, 0.5],
    ];
    for (const [x, y] of targets) {
      act(() => {
        for (let n = 0; n <= 20; n++) {
          now += 100;
          receive([x * 0.3 + 0.4, y * 0.2 + 0.4, 0.5, 0.5]);
        }
      });
    }
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Começar navegação" }));
    });
    const pause = await screen.findByRole("button", { name: "Pausar navegação pelo olhar" });
    Object.defineProperty(document, "elementFromPoint", { configurable: true, value: () => pause });
    act(() => {
      now += 100;
      receive([0.55, 0.5, 0.5, 0.5]);
      now += 1500;
      receive([0.55, 0.5, 0.5, 0.5]);
    });
    expect(screen.getByRole("button", { name: "Retomar navegação pelo olhar" })).toBeVisible();
    act(() => {
      now += 100;
      receive([0.55, 0.5, 0.5, 0.5]);
      now += 1800;
      receive([0.55, 0.5, 0.5, 0.5]);
    });
    expect(screen.getByRole("button", { name: "Retomar navegação pelo olhar" })).toBeVisible();

    // Opening a real Base UI modal must include assistive controls in its focus/ARIA scope.
    await act(async () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogTitle>Formulário de teste</DialogTitle>
            <DialogDescription>Editar produto</DialogDescription>
            <button>Salvar produto</button>
          </DialogContent>
        </Dialog>,
      );
    });
    const dialog = await screen.findByRole("dialog", { name: "Formulário de teste" });
    const stop = await within(dialog).findByRole("button", {
      name: "Encerrar navegação pelo olhar",
    });
    Object.defineProperty(document, "elementFromPoint", { configurable: true, value: () => stop });
    expect(targetAt(1, 1)).toBe(stop);
  });

  it("explains camera use before starting and releases a session on unmount", async () => {
    const stop = vi.fn();
    vi.mocked(startTracking).mockResolvedValue({ stop });
    const view = render(<GazeNavigation onClose={() => {}} />);
    expect(startTracking).not.toHaveBeenCalled();
    expect(screen.getByText(/não é gravado nem enviado/)).toBeVisible();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Permitir câmera e calibrar" }));
    });
    expect(await screen.findByRole("heading", { name: "Calibrar olhar · 1 de 9" })).toBeVisible();
    const signal = vi.mocked(startTracking).mock.calls[0][0];
    view.unmount();
    expect(signal.aborted).toBe(true);
    expect(stop).toHaveBeenCalled();
  });

  it("shows a useful error when camera access is denied and can return to configuration", async () => {
    vi.mocked(startTracking).mockRejectedValue(new DOMException("Denied", "NotAllowedError"));
    render(<GazeNavigation onClose={() => {}} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Permitir câmera e calibrar" }));
    });
    expect(await screen.findByRole("alert")).toHaveTextContent(/acesso à câmera foi negado/);
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(screen.getByRole("button", { name: "Permitir câmera e calibrar" })).toBeEnabled();
  });

  it("stops tracking and explains why when the page becomes hidden", async () => {
    const stop = vi.fn();
    vi.mocked(startTracking).mockResolvedValue({ stop });
    render(<GazeNavigation onClose={() => {}} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Permitir câmera e calibrar" }));
    });
    vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    fireEvent(document, new Event("visibilitychange"));
    expect(await screen.findByRole("alert")).toHaveTextContent(/câmera desligada/);
    expect(stop).toHaveBeenCalled();
  });

  it("offers Escape as a session-wide emergency exit", () => {
    const close = vi.fn();
    render(<GazeNavigation onClose={close} />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(close).toHaveBeenCalled();
  });
});
