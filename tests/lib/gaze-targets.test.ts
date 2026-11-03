import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { activateTarget, scrollContent, targetAt } from "@/lib/gaze/targets";

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe("eye selection targets", () => {
  it("scrolls the accessible modal rather than a larger hidden background viewport", () => {
    const background = document.createElement("main");
    background.setAttribute("aria-hidden", "true");
    const modal = document.createElement("div");
    modal.setAttribute("role", "dialog");
    document.body.append(background, modal);
    for (const [element, height] of [
      [background, 600],
      [modal, 300],
    ] as const) {
      Object.defineProperties(element, {
        clientHeight: { value: height },
        clientWidth: { value: 500 },
        scrollHeight: { value: 1200 },
      });
      element.getBoundingClientRect = () =>
        ({ width: 500, height, bottom: height, top: 0 }) as DOMRect;
      element.scrollBy = vi.fn();
    }
    scrollContent(1);
    expect(modal.scrollBy).toHaveBeenCalled();
    expect(background.scrollBy).not.toHaveBeenCalled();
  });

  it("can select an accessible control inside an open widget shadow root", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const shadow = host.attachShadow({ mode: "open" });
    const button = document.createElement("button");
    shadow.append(button);
    Object.defineProperty(document, "elementFromPoint", { configurable: true, value: () => host });
    Object.defineProperty(shadow, "elementFromPoint", { configurable: true, value: () => button });
    expect(targetAt(1, 1)).toBe(button);
    host.setAttribute("aria-hidden", "true");
    expect(targetAt(1, 1)).toBeNull();
  });

  it("selects semantic controls, including their icons, but rejects disabled and inert controls", () => {
    const button = document.createElement("button");
    const icon = document.createElement("span");
    button.append(icon);
    document.body.append(button);
    Object.defineProperty(document, "elementFromPoint", { configurable: true, value: () => icon });
    expect(targetAt(1, 1)).toBe(button);
    button.disabled = true;
    expect(targetAt(1, 1)).toBeNull();
    button.disabled = false;
    button.setAttribute("inert", "");
    expect(targetAt(1, 1)).toBeNull();
  });
  it("focuses text fields without toggling or submitting and never activates detached controls", () => {
    const input = document.createElement("input");
    document.body.append(input);
    const clicked = vi.fn();
    input.addEventListener("click", clicked);
    activateTarget(input);
    expect(document.activeElement).toBe(input);
    expect(clicked).not.toHaveBeenCalled();
    const button = document.createElement("button");
    button.addEventListener("click", clicked);
    activateTarget(button);
    expect(clicked).not.toHaveBeenCalled();
  });
});
