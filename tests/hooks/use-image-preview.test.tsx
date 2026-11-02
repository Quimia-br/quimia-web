import { cleanup, renderHook } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { useImagePreview } from "@/hooks/use-image-preview";

const liveUrls = new Set<string>();
beforeEach(() => {
  let sequence = 0;
  liveUrls.clear();
  vi.stubGlobal(
    "URL",
    class extends URL {
      static createObjectURL = vi.fn<(file: Blob) => string>(() => {
        const url = `blob:preview-${++sequence}`;
        liveUrls.add(url);
        return url;
      });
      static revokeObjectURL = vi.fn((url: string) => {
        liveUrls.delete(url);
      });
    },
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("useImagePreview", () => {
  it("keeps independent ownership when two consumers preview the same File", () => {
    const file = new File(["image"], "logo.png", { type: "image/png" });
    const first = renderHook(() => useImagePreview(file));
    const second = renderHook(() => useImagePreview(file));
    expect(first.result.current).toBe("blob:preview-1");
    expect(second.result.current).toBe("blob:preview-2");
    first.unmount();
    expect(liveUrls).toEqual(new Set(["blob:preview-2"]));
    expect(second.result.current).toBe("blob:preview-2");
    second.unmount();
    expect(liveUrls.size).toBe(0);
  });

  it("retains its allocation on rerenders and releases it when the File is replaced", () => {
    const original = new File(["first"], "logo.png");
    const replacement = new File(["second"], "logo.png");
    const { result, rerender, unmount } = renderHook(({ file }) => useImagePreview(file), {
      initialProps: { file: original },
    });
    rerender({ file: original });
    expect(result.current).toBe("blob:preview-1");
    expect(URL.createObjectURL).toHaveBeenCalledExactlyOnceWith(original);
    rerender({ file: replacement });
    expect(result.current).toBe("blob:preview-2");
    expect(liveUrls).toEqual(new Set(["blob:preview-2"]));
    unmount();
    expect(liveUrls.size).toBe(0);
  });

  it("does not allocate browser resources during server rendering", () => {
    const file = new File(["image"], "logo.png");
    function Preview() {
      return <output>{useImagePreview(file) ?? "unavailable"}</output>;
    }
    expect(renderToString(<Preview />)).toBe("<output>unavailable</output>");
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
});
