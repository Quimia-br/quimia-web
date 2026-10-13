import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useIsMobile } from "./use-mobile";

function Probe() { return <output>{useIsMobile() ? "mobile" : "desktop"}</output>; }
afterEach(() => vi.unstubAllGlobals());

describe("useIsMobile", () => {
  it("reads the current media query and reacts to breakpoint changes", () => {
    let matches = true;
    const listeners = new Set<() => void>();
    vi.stubGlobal("matchMedia", vi.fn(() => ({ get matches() { return matches; }, addEventListener: (_: string, listener: () => void) => listeners.add(listener), removeEventListener: (_: string, listener: () => void) => listeners.delete(listener) })));
    const { unmount } = render(<Probe />);
    expect(screen.getByText("mobile")).toBeInTheDocument();
    act(() => { matches = false; listeners.forEach(listener => listener()); });
    expect(screen.getByText("desktop")).toBeInTheDocument();
    unmount();
    expect(listeners.size).toBe(0);
  });
});
