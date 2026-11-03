// @vitest-environment node
import { createServer as createHttpServer } from "node:http";
import type { AddressInfo } from "node:net";
import { createServer } from "vite";
import { expect, it, vi } from "vite-plus/test";
import viteConfig from "../../vite.config";

it.each([
  { status: 200, type: "application/json", body: '{"analiseId":"analysis"}' },
  { status: 502, type: "application/problem+json", body: '{"detail":"extrator_falhou"}' },
  {
    status: 200,
    type: "text/html; charset=utf-8",
    body: "<!doctype html><title>Erro Interno</title>",
  },
])(
  "preserves an FDS multipart upload and upstream $status $type response",
  async (reply) => {
    const pdf = "%PDF-1.7\nFDS de teste\n%%EOF";
    let received:
      | {
          path?: string;
          origin?: string;
          authorization?: string;
          csrf?: string | string[];
          cookie?: string;
          form: FormData;
        }
      | undefined;
    const upstream = createHttpServer(async (request, response) => {
      const chunks: Buffer[] = [];
      for await (const chunk of request) chunks.push(chunk);
      const multipart = new Request("http://upstream.test", {
        method: "POST",
        headers: { "Content-Type": request.headers["content-type"]! },
        body: Buffer.concat(chunks),
      });
      received = {
        path: request.url,
        origin: request.headers.origin,
        authorization: request.headers.authorization,
        csrf: request.headers["x-csrf-token"],
        cookie: request.headers.cookie,
        form: await multipart.formData(),
      };
      response.writeHead(reply.status, { "Content-Type": reply.type }).end(reply.body);
    });
    await new Promise<void>((resolve) => upstream.listen(0, "127.0.0.1", resolve));
    vi.stubEnv("VITE_API_URL", `http://127.0.0.1:${(upstream.address() as AddressInfo).port}`);
    let vite: Awaited<ReturnType<typeof createServer>> | undefined;
    try {
      const config = viteConfig({ command: "serve", mode: "test" });
      vite = await createServer({
        configFile: false,
        server: { ...config.server, port: 0, host: "127.0.0.1", hmr: false, watch: null },
        optimizeDeps: { noDiscovery: true, include: [] },
      });
      await vite.listen();
      const origin = `http://127.0.0.1:${(vite.httpServer!.address() as AddressInfo).port}`;
      const form = new FormData();
      form.append("fds", new Blob([pdf], { type: "application/pdf" }), "Ácido sulfúrico.pdf");
      form.append("analiseAnterior", "previous-analysis");
      const response = await fetch(`${origin}/api/v1/empresas/me/produtos/fds/analises`, {
        method: "POST",
        headers: {
          Origin: origin,
          Authorization: "Bearer test-token",
          Cookie: "quimia_csrf=test-csrf",
          "X-CSRF-TOKEN": "test-csrf",
        },
        body: form,
        redirect: "manual",
      });
      expect(response.status).toBe(reply.status);
      expect(response.headers.get("content-type")).toBe(reply.type);
      expect(await response.text()).toBe(reply.body);
      expect(received).toMatchObject({
        path: "/api/v1/empresas/me/produtos/fds/analises",
        origin: undefined,
        authorization: "Bearer test-token",
        cookie: "quimia_csrf=test-csrf",
        csrf: "test-csrf",
      });
      expect([...received!.form.keys()]).toEqual(["fds", "analiseAnterior"]);
      expect(received!.form.get("analiseAnterior")).toBe("previous-analysis");
      const uploaded = received!.form.get("fds") as File;
      expect(uploaded.name).toBe("Ácido sulfúrico.pdf");
      expect(uploaded.type).toBe("application/pdf");
      expect(await uploaded.text()).toBe(pdf);
    } finally {
      await vite?.close();
      await new Promise<void>((resolve, reject) =>
        upstream.close((error) => (error ? reject(error) : resolve())),
      );
      vi.unstubAllEnvs();
    }
  },
  20000,
);

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
    response.end(
      JSON.stringify({
        path: request.url,
        body: Buffer.concat(chunks).toString(),
        cookie: request.headers.cookie,
        csrf: request.headers["x-csrf-token"],
      }),
    );
  });
  await new Promise<void>((resolve) => upstream.listen(0, "127.0.0.1", resolve));
  vi.stubEnv("VITE_API_URL", `http://127.0.0.1:${(upstream.address() as AddressInfo).port}`);
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
    await new Promise<void>((resolve, reject) =>
      upstream.close((error) => (error ? reject(error) : resolve())),
    );
    vi.unstubAllEnvs();
  }
}, 20000);
