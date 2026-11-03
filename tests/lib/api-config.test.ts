import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import viteConfig from "../../vite.config";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("API origin configuration", () => {
  it("uses VITE_API_URL for production requests and the development proxy", async () => {
    vi.stubEnv("DEV", false);
    vi.stubEnv("VITE_API_URL", "https://api.example.com/");
    const { api } = await import("@/services/api");

    expect(api.defaults.baseURL).toBe("https://api.example.com/api/v1");
    const config = viteConfig({ command: "serve", mode: "test" });
    expect(config.server?.proxy?.["/api"]).toMatchObject({ target: "https://api.example.com" });
  });

  it("uses same-origin requests when VITE_API_URL is absent", async () => {
    vi.stubEnv("DEV", false);
    vi.stubEnv("VITE_API_URL", undefined);
    const { api } = await import("@/services/api");

    expect(api.defaults.baseURL).toBe("/api/v1");
  });

  it("uses same-origin requests and the local development proxy when VITE_API_URL is empty", async () => {
    vi.stubEnv("DEV", false);
    vi.stubEnv("VITE_API_URL", "");
    const { api } = await import("@/services/api");

    expect(api.defaults.baseURL).toBe("/api/v1");
    const config = viteConfig({ command: "serve", mode: "test" });
    expect(config.server?.proxy?.["/api"]).toMatchObject({ target: "http://localhost:8080" });
  });

  it.each([
    "api.example.com",
    "https://api.example.com/api/v1",
    "ftp://api.example.com",
    "https://api.example.com/?token=value",
  ])("rejects an invalid API origin: %s", (origin) => {
    vi.stubEnv("VITE_API_URL", origin);
    expect(() => viteConfig({ command: "serve", mode: "test" })).toThrow(/VITE_API_URL/);
  });
});
