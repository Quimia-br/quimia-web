import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { FdsFilePicker } from "@/components/ProductFdsUpload";

afterEach(cleanup);
describe("FDS file input labels", () => {
  it("associates each picker with its own explicit label", () => {
    render(
      <>
        <FdsFilePicker file={null} disabled={false} onSelect={vi.fn()} onRemove={vi.fn()} />
        <FdsFilePicker file={null} disabled={false} onSelect={vi.fn()} onRemove={vi.fn()} />
      </>,
    );
    const inputs = screen.getAllByLabelText<HTMLInputElement>("Arquivo PDF da FDS");
    expect(inputs).toHaveLength(2);
    expect(inputs[0].id).not.toBe(inputs[1].id);
    inputs.forEach((input) => {
      expect(input.labels).toHaveLength(1);
      expect(input.labels?.[0]).toHaveAttribute("for", input.id);
    });
  });
});
