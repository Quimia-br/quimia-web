import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ImagemContainer } from "./ImageContainer";

const remoteImage = "https://res.cloudinary.com/demo/image/upload/sample.jpg";

describe("ImageContainer", () => {
  beforeEach(() => {
    let count = 0;
    vi.stubGlobal("URL", class extends URL {
      static createObjectURL = vi.fn((file: Blob) => {
        if (!(file instanceof Blob)) throw new TypeError("Expected Blob");
        return `blob:image-${++count}`;
      });
      static revokeObjectURL = vi.fn();
    });
  });
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

  it("shows an existing Cloudinary URL without treating it as a local file", () => {
    render(<ImagemContainer value={remoteImage} label="Logo" onChange={vi.fn()} />);

    expect(screen.getByRole("img", { name: "Logo" })).toHaveAttribute("src", remoteImage);
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it("opens the existing image for editing and preserves it on cancel", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ImagemContainer value={remoteImage} label="Logo" onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Editar enquadramento de Logo" }));
    expect(await screen.findByRole("dialog", { name: "Editar imagem" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Imagem para recorte" })).toHaveAttribute("src", remoteImage);
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("img", { name: "Logo" })).toHaveAttribute("src", remoteImage);
  });

  it("opens a selected file as a draft without committing before confirmation", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(<ImagemContainer label="Logo" onChange={onChange} />);
    const file = new File(["image"], "logo.png", { type: "image/png" });
    await user.upload(container.querySelector("input[type=file]") as HTMLInputElement, file);

    expect(await screen.findByRole("dialog", { name: "Editar imagem" })).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:image-1");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("reports an oversized file and keeps the saved value", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(<ImagemContainer label="Logo" value={remoteImage} maxFileSize={3} onChange={onChange} />);
    await user.upload(container.querySelector("input[type=file]") as HTMLInputElement,
      new File(["large image"], "logo.png", { type: "image/png" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/tamanho|limite/i);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("revokes only owned preview URLs when the value changes or unmounts", async () => {
    const file = new File(["image"], "logo.png", { type: "image/png" });
    const { rerender, unmount } = render(<ImagemContainer label="Logo" value={file} onChange={vi.fn()} />);
    await waitFor(() => expect(screen.getByRole("img", { name: "Logo" })).toHaveAttribute("src", "blob:image-1"));
    rerender(<ImagemContainer label="Logo" value={remoteImage} onChange={vi.fn()} />);
    await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:image-1"));
    unmount();
    expect(URL.revokeObjectURL).not.toHaveBeenCalledWith(remoteImage);
  });

  it("offers replacement after a remote preview fails to load", async () => {
    render(<ImagemContainer label="Logo" value={remoteImage} onChange={vi.fn()} />);
    fireEvent.error(screen.getByRole("img", { name: "Logo" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/carregar/i);
    expect(screen.getByRole("button", { name: "Alterar imagem de Logo" })).toBeEnabled();
  });

  it("does not expose editing actions in read-only mode", () => {
    render(<ImagemContainer label="Logo" value={remoteImage} readOnly onChange={vi.fn()} />);
    expect(screen.getByRole("img", { name: "Logo" })).toHaveAttribute("src", remoteImage);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("discards a draft when an API update replaces the field, even if the previous value returns", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<ImagemContainer label="Logo" value={remoteImage} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "Editar enquadramento de Logo" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    rerender(<ImagemContainer label="Logo" value={remoteImage + "?v=2"} onChange={onChange} />);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    rerender(<ImagemContainer label="Logo" value={remoteImage} onChange={onChange} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("rejects unsupported files without replacing the saved URL", async () => {
    const user = userEvent.setup({ applyAccept: false });
    const onChange = vi.fn();
    const { container } = render(<ImagemContainer label="Logo" value={remoteImage} onChange={onChange} />);
    await user.upload(container.querySelector("input[type=file]") as HTMLInputElement,
      new File(["pdf"], "documento.pdf", { type: "application/pdf" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/JPEG, PNG ou WebP/);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Logo" })).toHaveAttribute("src", remoteImage);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("removes file selection and editing actions when disabled", () => {
    const { container } = render(<ImagemContainer label="Logo" value={remoteImage} disabled onChange={vi.fn()} />);
    expect(screen.getByRole("img", { name: "Logo" })).toBeVisible();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(container.querySelector("input[type=file]")).not.toBeInTheDocument();
  });

  it("discards an open edit when the field becomes disabled", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<ImagemContainer label="Logo" value={remoteImage} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "Editar enquadramento de Logo" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    rerender(<ImagemContainer label="Logo" value={remoteImage} disabled onChange={onChange} />);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    rerender(<ImagemContainer label="Logo" value={remoteImage} onChange={onChange} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("rejects a multi-file drop as a whole without opening a partial selection", async () => {
    const onChange = vi.fn();
    render(<ImagemContainer label="Logo" value={remoteImage} onChange={onChange} />);
    const files = [new File(["a"], "a.png", { type: "image/png" }), new File(["b"], "b.png", { type: "image/png" })];
    fireEvent.drop(screen.getByRole("group", { name: "Logo" }), {
      dataTransfer: { files, items: files.map(file => ({ kind: "file", type: file.type, getAsFile: () => file })), types: ["Files"] },
    });
    expect(await screen.findByRole("alert")).toHaveTextContent(/apenas uma imagem/);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("img", { name: "Logo" })).toHaveAttribute("src", remoteImage);
  });

  it("associates the caller's validation error with the image field", () => {
    render(<ImagemContainer label="Logo" error="Selecione a foto da empresa" onChange={vi.fn()} />);
    const field = screen.getByRole("group", { name: "Logo" });
    expect(field).toHaveAccessibleDescription("Selecione a foto da empresa");
    expect(screen.getByRole("alert")).toBeVisible();
  });

  it("cancels an edit with Escape without replacing the saved value", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ImagemContainer label="Logo" value={remoteImage} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "Editar enquadramento de Logo" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("img", { name: "Logo" })).toHaveAttribute("src", remoteImage);
  });

  it("releases every owned file preview even with StrictMode subscription replay", async () => {
    const file = new File(["image"], "logo.png", { type: "image/png" });
    const { unmount } = render(<StrictMode><ImagemContainer label="Logo" value={file} onChange={vi.fn()} /></StrictMode>);
    await waitFor(() => expect(screen.getByRole("img", { name: "Logo" })).toHaveAttribute("src", expect.stringMatching(/^blob:image-/)));
    unmount();
    for (const result of vi.mocked(URL.createObjectURL).mock.results) {
      expect(URL.revokeObjectURL).toHaveBeenCalledWith(result.value);
    }
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(vi.mocked(URL.createObjectURL).mock.calls.length);
  });
});
