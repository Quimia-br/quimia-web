import { AxiosHeaders } from "axios";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-token";
import { fdsError } from "@/lib/fds-error";
import { analyzeFds } from "@/services/produto";
import { cleanAnalysis, pendingAnalysis } from "../fixtures/fds";

const originalAdapter = api.defaults.adapter;
const originalAuth = useAuthStore.getState();
const path = "/empresas/me/produtos/fds/analises/assincronas";
const pdf = () => new File(["%PDF-1.7"], "ficha.pdf", { type: "application/pdf" });
const processing = {
  id: "job-1",
  status: "processando",
  analise: null,
  codigo: null,
  detail: null,
};

afterEach(() => {
  api.defaults.adapter = originalAdapter;
  useAuthStore.setState(originalAuth);
  vi.useRealTimers();
});

describe("asynchronous FDS analysis", () => {
  it("uploads once, polls while processing and returns the reviewed analysis", async () => {
    vi.useFakeTimers();
    const requests: string[] = [];
    let polls = 0;
    const file = pdf();
    const controller = new AbortController();
    api.defaults.adapter = async (config) => {
      requests.push(`${config.method} ${config.url}`);
      expect(config.signal).toBe(controller.signal);
      if (config.method === "post") {
        expect(Object.fromEntries((config.data as FormData).entries())).toEqual({
          fds: file,
          analiseAnterior: "previous-analysis",
        });
      }
      const data =
        config.method === "post" || ++polls === 1
          ? processing
          : { ...processing, status: "concluida", analise: pendingAnalysis };
      return {
        config,
        data,
        status: config.method === "post" ? 202 : 200,
        statusText: "OK",
        headers: new AxiosHeaders(),
      };
    };
    const result = analyzeFds(file, controller.signal, "previous-analysis");
    const assertion = expect(result).resolves.toEqual(pendingAnalysis);
    await vi.runAllTimersAsync();
    await assertion;
    expect(requests).toEqual([`post ${path}`, `get ${path}/job-1`, `get ${path}/job-1`]);
  });

  it("accepts a job that completes before the upload response returns", async () => {
    api.defaults.adapter = async (config) => ({
      config,
      data: { ...processing, status: "concluida", analise: cleanAnalysis },
      status: 202,
      statusText: "Accepted",
      headers: new AxiosHeaders(),
    });
    await expect(analyzeFds(pdf())).resolves.toEqual(cleanAnalysis);
  });

  it.each([
    [422, "fds_invalida"],
    [502, "extrator_falhou"],
    [500, "analise_falhou"],
  ])("preserves the extractor failure %s / %s returned by polling", async (codigo, detail) => {
    vi.useFakeTimers();
    api.defaults.adapter = async (config) => ({
      config,
      data:
        config.method === "post" ? processing : { ...processing, status: "falhou", codigo, detail },
      status: config.method === "post" ? 202 : 200,
      statusText: "OK",
      headers: new AxiosHeaders(),
    });
    const assertion = expect(analyzeFds(pdf())).rejects.toMatchObject({
      isAxiosError: true,
      response: { status: codigo, data: { detail } },
    });
    await vi.runAllTimersAsync();
    await assertion;
  });

  it("cancels polling during the interval without another request", async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const requests: string[] = [];
    api.defaults.adapter = async (config) => {
      requests.push(config.url!);
      return {
        config,
        data: processing,
        status: 202,
        statusText: "Accepted",
        headers: new AxiosHeaders(),
      };
    };
    const result = analyzeFds(pdf(), controller.signal);
    const assertion = expect(result).rejects.toMatchObject({ code: "ERR_CANCELED" });
    await vi.advanceTimersByTimeAsync(0);
    controller.abort();
    await vi.runAllTimersAsync();
    await assertion;
    expect(requests).toEqual([path]);
  });

  it("stops polling if the signed-in company changes between requests", async () => {
    vi.useFakeTimers();
    const requests: string[] = [];
    api.defaults.adapter = async (config) => {
      requests.push(config.url!);
      return {
        config,
        data: processing,
        status: 202,
        statusText: "Accepted",
        headers: new AxiosHeaders(),
      };
    };
    const assertion = expect(analyzeFds(pdf())).rejects.toMatchObject({ code: "ERR_CANCELED" });
    await vi.advanceTimersByTimeAsync(0);
    useAuthStore.getState().actions.logout();
    await vi.runAllTimersAsync();
    await assertion;
    expect(requests).toEqual([path]);
  });

  it("stops a job that never finishes and gives a retryable error instead of loading forever", async () => {
    vi.useFakeTimers();
    let uploads = 0;
    api.defaults.adapter = async (config) => {
      if (config.method === "post") uploads++;
      return {
        config,
        data: processing,
        status: 200,
        statusText: "OK",
        headers: new AxiosHeaders(),
      };
    };
    const result = analyzeFds(pdf()).catch((error: unknown) => error);
    await vi.runAllTimersAsync();
    const error = await result;
    expect(error).toMatchObject({ code: "ETIMEDOUT" });
    expect(fdsError(error)).toMatch(/demorou/);
    expect(uploads).toBe(1);
  });

  it.each([
    "<html>Unavailable</html>",
    { ...processing, status: "concluida", analise: null },
    { ...processing, status: "falhou", codigo: null },
  ])("rejects a malformed job response without reporting success: %j", async (data) => {
    api.defaults.adapter = async (config) => ({
      config,
      data,
      status: 202,
      statusText: "Accepted",
      headers: new AxiosHeaders(),
    });
    await expect(analyzeFds(pdf())).rejects.toThrow("invalid_fds_analysis_response");
  });
});
