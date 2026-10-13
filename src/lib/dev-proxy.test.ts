// @vitest-environment node
import { createServer as createHttpServer } from "node:http";
import type { AddressInfo } from "node:net";
import { createServer } from "vite";
import { expect, it, vi } from "vitest";
import viteConfig from "../../vite.config";

it("forwards a bodyless refresh and cookies through the local origin without upstream CORS rejection", async () => {
  const upstream = createHttpServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    // Model SecurityConfig's refusal of origins outside its configured allowlist.
    if (request.headers.origin) {
      response.writeHead(403).end();
      return;
    }
    response.setHeader("Content-Type", "application/json");
    response.setHeader("Set-Cookie", [
      "quimia_rt=renewed; Domain=api.example; Path=/api/v1/empresas/auth; HttpOnly; SameSite=Lax",
      "quimia_csrf=renewed-csrf; Domain=api.example; Path=/; SameSite=Lax",
    ]);
    response.end(JSON.stringify({
      path: request.url,
      body: Buffer.concat(chunks).toString(),
      cookie: request.headers.cookie,
      csrf: request.headers["x-csrf-token"],
    }));
  });
  await new Promise<void>((resolve) => upstream.listen(0, "127.0.0.1", resolve));
  vi.stubEnv("VITE_API_KEY", `http://127.0.0.1:${(upstream.address() as AddressInfo).port}`);
  const config = viteConfig({ command: "serve", mode: "test" });
  const vite = await createServer({
    configFile: false,
    server: { ...config.server, port: 0, host: "127.0.0.1", hmr: false, watch: null },
    optimizeDeps: { noDiscovery: true, include: [] },
  });

  try {
    await vite.listen();
    const port = (vite.httpServer!.address() as AddressInfo).port;
    const response = await fetch(`http://127.0.0.1:${port}/api/v1/empresas/auth/refresh`, {
      method: "POST",
      headers: {
        Origin: `http://127.0.0.1:${port}`,
        Cookie: "quimia_rt=previous; quimia_csrf=csrf",
        "X-CSRF-TOKEN": "csrf",
      },
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      path: "/api/v1/empresas/auth/refresh",
      body: "",
      cookie: "quimia_rt=previous; quimia_csrf=csrf",
      csrf: "csrf",
    });
    expect(response.headers.getSetCookie()).toEqual([
      "quimia_rt=renewed; Path=/api/v1/empresas/auth; HttpOnly; SameSite=Lax",
      "quimia_csrf=renewed-csrf; Path=/; SameSite=Lax",
    ]);
  } finally {
    await vite.close();
    await new Promise<void>((resolve, reject) => upstream.close((error) => error ? reject(error) : resolve()));
    vi.unstubAllEnvs();
  }
}, 20000);
