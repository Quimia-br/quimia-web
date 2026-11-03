import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { useTouchPrimary } from "@/hooks/use-touch-primary";

class PointerQuery extends EventTarget {
  matches = false;
  setMatches(matches: boolean) {
    this.matches = matches;
    this.dispatchEvent(new Event("change"));
  }
}

let query: PointerQuery;
const originalTouch = Object.getOwnPropertyDescriptor(window, "ontouchstart");
beforeEach(() => {
  query = new PointerQuery();
  vi.stubGlobal("matchMedia", (media: string) => {
    if (media !== "(pointer: coarse)") throw new Error(`Unexpected query: ${media}`);
    return query;
  });
  vi.stubGlobal("navigator", { maxTouchPoints: 1 });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  if (originalTouch) Object.defineProperty(window, "ontouchstart", originalTouch);
});

describe("useTouchPrimary", () => {
  it("requires a coarse primary pointer even when touch is supported", () => {
    const { result } = renderHook(useTouchPrimary);
    expect(result.current).toBe(false);
    act(() => query.setMatches(true));
    expect(result.current).toBe(true);
    act(() => query.setMatches(false));
    expect(result.current).toBe(false);
  });

  it("requires touch capability when a browser reports a coarse pointer", () => {
    Reflect.deleteProperty(window, "ontouchstart");
    vi.stubGlobal("navigator", { maxTouchPoints: 0 });
    query.matches = true;
    const { result } = renderHook(useTouchPrimary);
    expect(result.current).toBe(false);
  });

  it("rechecks the current pointer on input and aborts both subscriptions on unmount", () => {
    const mediaListener = vi.spyOn(query, "addEventListener");
    const pointerListener = vi.spyOn(window, "addEventListener");
    const { result, unmount } = renderHook(useTouchPrimary);
    query.matches = true;
    act(() => window.dispatchEvent(new Event("pointerdown")));
    expect(result.current).toBe(true);
    const mediaOptions = mediaListener.mock.calls.find(([type]) => type === "change")?.[2];
    const pointerOptions = pointerListener.mock.calls.find(([type]) => type === "pointerdown")?.[2];
    if (
      !mediaOptions ||
      typeof mediaOptions === "boolean" ||
      !pointerOptions ||
      typeof pointerOptions === "boolean"
    ) {
      throw new Error("Both subscriptions must support cancellation");
    }
    expect(mediaOptions.signal).toBeInstanceOf(AbortSignal);
    expect(pointerOptions.signal).toBe(mediaOptions.signal);
    expect(mediaOptions.signal?.aborted).toBe(false);
    unmount();
    expect(mediaOptions.signal?.aborted).toBe(true);
  });
});
