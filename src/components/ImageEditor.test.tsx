import type { ComponentProps } from "react";
import type Cropper from "react-easy-crop";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ImageEditor from "./ImageEditor";
import { getCroppedImg } from "@/lib/utils/getCroppedImg";

vi.mock("@/lib/utils/getCroppedImg", () => ({ getCroppedImg: vi.fn() }));
// jsdom has no image layout. Real cropping/export is also exercised in Chromium.
vi.mock("react-easy-crop", () => ({
  default: (props: ComponentProps<typeof Cropper>) => (
    <img src={props.image} alt="Imagem para recorte" onError={event => props.mediaProps.onError?.(event)} onLoad={() => {
      props.onMediaLoaded?.({ width: 246, height: 388, naturalWidth: 1200, naturalHeight: 1600 });
      props.onCropAreaChange?.({ x: 0, y: 0, width: 100, height: 100 }, { x: 0, y: 0, width: 246, height: 388 });
    }} />
  ),
}));

const source = "https://res.cloudinary.com/demo/image/upload/sample.jpg";
const cropped = new File(["pixels"], "imagem.webp", { type: "image/webp" });
const exportMock = vi.mocked(getCroppedImg);

describe("ImageEditor save lifecycle", () => {
  beforeEach(() => { exportMock.mockReset(); });
  afterEach(cleanup);

  it("waits for image loading before allowing confirmation", () => {
    render(<ImageEditor open image={source} onOpenChange={vi.fn()} onSave={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Confirmar recorte" })).toBeDisabled();
    fireEvent.load(screen.getByRole("img", { name: "Imagem para recorte" }));
    expect(screen.getByRole("button", { name: "Confirmar recorte" })).toBeEnabled();
  });

  it("keeps the dialog open and blocks duplicate saves or dismissal until upload finishes", async () => {
    const user = userEvent.setup();
    let finish!: () => void;
    const onSave = vi.fn(() => new Promise<void>(resolve => { finish = resolve; }));
    const onOpenChange = vi.fn();
    exportMock.mockResolvedValue({ file: cropped });
    render(<ImageEditor open image={source} onOpenChange={onOpenChange} onSave={onSave} />);
    fireEvent.load(screen.getByRole("img", { name: "Imagem para recorte" }));
    await user.click(screen.getByRole("button", { name: "Confirmar recorte" }));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith(cropped));
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
    await user.keyboard("{Escape}");
    expect(onOpenChange).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Confirmar recorte" }));
    expect(onSave).toHaveBeenCalledTimes(1);
    await act(async () => finish());
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows an upload failure and lets the same crop be retried", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockRejectedValueOnce(new Error("Falha no envio. Tente novamente.")).mockResolvedValueOnce(undefined);
    const onOpenChange = vi.fn();
    exportMock.mockResolvedValue({ file: cropped });
    render(<ImageEditor open image={source} onOpenChange={onOpenChange} onSave={onSave} />);
    fireEvent.load(screen.getByRole("img", { name: "Imagem para recorte" }));
    await user.click(screen.getByRole("button", { name: "Confirmar recorte" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Falha no envio");
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Confirmar recorte" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Confirmar recorte" }));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(onSave).toHaveBeenCalledTimes(2);
  });

  it("aborts an obsolete export without committing or closing a new session", async () => {
    const user = userEvent.setup();
    let finish!: (result: { file: File }) => void;
    exportMock.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const onSave = vi.fn(), onOpenChange = vi.fn();
    const { rerender } = render(<ImageEditor open image={source} onOpenChange={onOpenChange} onSave={onSave} />);
    fireEvent.load(screen.getByRole("img", { name: "Imagem para recorte" }));
    await user.click(screen.getByRole("button", { name: "Confirmar recorte" }));
    const signal = exportMock.mock.calls[0][2]?.signal;
    rerender(<ImageEditor open image={source + "?v=2"} onOpenChange={onOpenChange} onSave={onSave} />);
    expect(signal?.aborted).toBe(true);
    await act(async () => finish({ file: cropped }));
    expect(onSave).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole("img", { name: "Imagem para recorte" })).toHaveAttribute("src", source + "?v=2");
  });

  it("renders no dialog when closed or when there is no image", () => {
    const { rerender } = render(<ImageEditor open={false} image={source} onOpenChange={vi.fn()} onSave={vi.fn()} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    rerender(<ImageEditor open image={null} onOpenChange={vi.fn()} onSave={vi.fn()} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("allows cancellation before the remote image finishes loading", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn(), onSave = vi.fn();
    render(<ImageEditor open image={source} onOpenChange={onOpenChange} onSave={onSave} />);
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onSave).not.toHaveBeenCalled();
    expect(exportMock).not.toHaveBeenCalled();
  });

  it("toggles the grid from either initial state without saving", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<ImageEditor open image={source} defaultGrid={false} onOpenChange={vi.fn()} onSave={onSave} />);
    const toggle = screen.getByRole("button", { name: "Mostrar grade" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    await user.click(toggle);
    expect(screen.getByRole("button", { name: "Ocultar grade" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "Ocultar grade" }));
    expect(screen.getByRole("button", { name: "Mostrar grade" })).toHaveAttribute("aria-pressed", "false");
    expect(onSave).not.toHaveBeenCalled();
  });

  it("reports a crop export failure without invoking the upload callback", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn(), onOpenChange = vi.fn();
    exportMock.mockRejectedValue(new Error("Não foi possível gerar o recorte."));
    render(<ImageEditor open image={source} onOpenChange={onOpenChange} onSave={onSave} />);
    fireEvent.load(screen.getByRole("img", { name: "Imagem para recorte" }));
    await user.click(screen.getByRole("button", { name: "Confirmar recorte" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/gerar o recorte/);
    expect(screen.getByRole("button", { name: "Confirmar recorte" })).toBeEnabled();
    expect(onSave).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("blocks export and gives recovery guidance if the source fails to load", () => {
    render(<ImageEditor open image={source} onOpenChange={vi.fn()} onSave={vi.fn()} />);
    fireEvent.error(screen.getByRole("img", { name: "Imagem para recorte" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/carregar.*arquivo/);
    expect(screen.getByRole("button", { name: "Confirmar recorte" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeEnabled();
    expect(exportMock).not.toHaveBeenCalled();
  });
});
