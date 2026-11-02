import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { openCamera } from "@/lib/gaze/camera";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("eye navigation camera lifecycle", () => {
  it("stops a stream granted after the user already cancelled", async () => {
    let grant!: (stream: MediaStream) => void;
    const stop = vi.fn();
    const stream = { getTracks: () => [{ stop }] } as unknown as MediaStream;
    vi.stubGlobal("isSecureContext", true);
    vi.stubGlobal("navigator", {
      mediaDevices: {
        getUserMedia: () =>
          new Promise<MediaStream>((r) => {
            grant = r;
          }),
      },
    });
    const controller = new AbortController();
    const result = openCamera(controller.signal);
    controller.abort();
    grant(stream);
    await expect(result).rejects.toMatchObject({ name: "AbortError" });
    expect(stop).toHaveBeenCalledOnce();
  });

  it("releases every track on abort and detaches the video", async () => {
    const stop = vi.fn();
    vi.stubGlobal("isSecureContext", true);
    vi.stubGlobal("navigator", {
      mediaDevices: { getUserMedia: async () => ({ getTracks: () => [{ stop }] }) },
    });
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    const controller = new AbortController();
    const camera = await openCamera(controller.signal);
    controller.abort();
    expect(stop).toHaveBeenCalledOnce();
    expect(camera.video.srcObject).toBeNull();
    camera.stop();
    expect(stop).toHaveBeenCalledOnce();
  });

  it("explains unavailable camera support without asking for permission", async () => {
    vi.stubGlobal("isSecureContext", false);
    await expect(openCamera(new AbortController().signal)).rejects.toThrow(/HTTPS/);
  });
});
