import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import SpeechInputIcon from "./SpeechInputIcon";

afterEach(cleanup);
describe("SpeechInputIcon", () => {
  it.each([
    ["idle", false, null, "mic"],
    ["listening", false, null, "mic"],
    ["listening", true, null, "audio-lines"],
    ["starting", false, null, "loader-circle"],
    ["stopping", false, null, "loader-circle"],
    ["idle", false, "Permissão negada", "circle-alert"],
  ] as const)("represents %s, speaking=%s, error=%s", (phase, speaking, error, icon) => {
    const { container } = render(<SpeechInputIcon speech={{ phase, speaking, error }} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveClass(`lucide-${icon}`);
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });
  it("returns to the microphone when speech ends without changing the surrounding control", () => {
    const { container, rerender } = render(<SpeechInputIcon speech={{ phase: "listening", speaking: true, error: null }} />);
    expect(container.querySelector(".lucide-audio-lines")).not.toBeNull();
    rerender(<SpeechInputIcon speech={{ phase: "listening", speaking: false, error: null }} />);
    expect(container.querySelector(".lucide-audio-lines")).toBeNull();
    expect(container.querySelector(".lucide-mic")).not.toBeNull();
  });
});
