import { AxiosError, AxiosHeaders, isAxiosError } from "axios";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { api } from "@/lib/api";
import { forgotPassword, login, register, resetPassword } from "@/services/auth";
import { updateMe } from "@/services/empresas";
import * as produtos from "@/services/produto";
import { validateImage, validatePdf } from "@/utils/validation-files";
import { validateRegister, validateResetPassword, validateLogin } from "@/utils/validation-auth";

const originalAdapter = api.defaults.adapter;
const empresa = { id: 1, nome: "Empresa", email: "empresa@example.com" };
const registration = { ...empresa, cnpj: "11.222.333/0001-81", senha: "SenhaValida2026" };
const produto = { id: 1, nome: "Produto", tipo: null, descricao: null, codBarras: null,
  fotoUrl: null, marca: { id: 1, nome: "Marca", logoUrl: null } };
afterEach(() => { api.defaults.adapter = originalAdapter; });

describe("validation before transport", () => {
  it("accepts alphanumeric CNPJ and exact contract boundaries", () => {
    expect(validateRegister({ ...registration, cnpj: "12.ABC.345/01DE-35", nome: "x".repeat(255), senha: "a1" + "é".repeat(35) }).cnpj).toBe("12.ABC.345/01DE-35");
    expect(validateLogin({ email: empresa.email, senha: "a".repeat(72) }).senha).toHaveLength(72);
    expect(() => validateLogin({ email: empresa.email, senha: "a".repeat(73) })).toThrow();
    expect(() => validateResetPassword({ resetToken: "x".repeat(2049), novaSenha: registration.senha })).toThrow();
  });
  it("validates bytes rather than rejecting legitimate files by MIME or filename", async () => {
    const pdf = new File(["%PDF-1.7"], "unknown.bin", { type: "text/plain" });
    const image = new File(["RIFFxxxxWEBP"], "unknown.bin", { type: "application/octet-stream" });
    await expect(validatePdf(pdf)).resolves.toBe(pdf);
    await expect(validateImage(image)).resolves.toBe(image);
    await expect(validatePdf(new File(["invalid"], "fake.pdf", { type: "application/pdf" }))).rejects.toThrow();
    await expect(validateImage(new File(["invalid"], "fake.png", { type: "image/png" }))).rejects.toThrow();
  });
  it("rejects files above the API size limit before reading bytes", async () => {
    await expect(validateImage(new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.png"))).rejects.toThrow();
    await expect(validatePdf(new File([new Uint8Array(10 * 1024 * 1024 + 1)], "large.pdf"))).rejects.toThrow();
  });
  it.each([
    () => register({ ...registration, nome: "x" }),
    () => register({ ...registration, cnpj: "11.222.333/0001-80" }),
    () => register({ ...registration, senha: "senha123" }),
    () => register({ ...registration, senha: "é".repeat(36) + "1" }),
    () => forgotPassword("x\n@example.com"),
    () => resetPassword({ resetToken: "", novaSenha: "SenhaValida2026" }),
    () => updateMe({ nome: "Empresa\u0000" }),
    () => produtos.create({ nome: "Produto", tipo: "x".repeat(51) }),
    () => produtos.create({ nome: "Produto", tipo: "outro", descricao: "x".repeat(4001) }),
    () => produtos.analyzeFds(new File(["text"], "arquivo.txt", { type: "text/plain" })),
  ])("rejects invalid payload without sending a request", async (operation) => {
    let requests = 0;
    api.defaults.adapter = async () => { requests += 1; throw new Error("transport"); };
    await expect(operation()).rejects.toThrow();
    expect(requests).toBe(0);
  });

  it("normalizes names and email while preserving the complete password", async () => {
    api.defaults.adapter = async (config) => {
      expect(JSON.parse(config.data)).toMatchObject({ nome: "Empresa", email: empresa.email, senha: " SenhaValida2026 " });
      return { config, data: empresa, status: 201, statusText: "Created", headers: new AxiosHeaders() };
    };
    await register({ ...registration, nome: " Empresa ", email: " EMPRESA@example.com ", senha: " SenhaValida2026 " });
  });

  it("allows legacy login passwords without imposing registration policy", async () => {
    api.defaults.adapter = async (config) => {
      expect(JSON.parse(config.data).senha).toBe(" x ");
      return { config, data: { accessToken: "token", tokenType: "Bearer", expiresIn: 3600, empresa },
        status: 200, statusText: "OK", headers: new AxiosHeaders() };
    };
    await expect(login({ email: empresa.email, senha: " x " })).resolves.toEqual(empresa);
  });

  it("normalizes unexpected transport failures while preserving their cause", async () => {
    api.defaults.adapter = async () => { throw "connection interrupted"; };
    await expect(forgotPassword(empresa.email)).rejects.toMatchObject({
      name: "ServiceError", cause: "connection interrupted", operation: "auth.forgotPassword",
    });
  });

  it("preserves Axios errors and their response metadata", async () => {
    const original = new AxiosError("Unavailable", "ERR_NETWORK");
    api.defaults.adapter = async () => { throw original; };
    const error = await forgotPassword(empresa.email).catch((cause: unknown) => cause);
    expect(isAxiosError(error)).toBe(true);
    expect(error).toMatchObject({ code: "ERR_NETWORK" });
  });
});

describe("product detail boundary", () => {
  it.each([0, -1, 1.5, NaN, Infinity, 2147483648])("rejects invalid id %s before transport", async (id) => {
    let requests = 0;
    api.defaults.adapter = async () => { requests += 1; throw new Error("transport"); };
    await expect(produtos.getById(id)).rejects.toThrow();
    expect(requests).toBe(0);
  });
  it("uses the existing detail endpoint and forwards the AbortSignal", async () => {
    const signal = new AbortController().signal;
    api.defaults.adapter = async (config) => {
      expect(config.url).toBe("/produtos/1");
      expect(config.signal).toBe(signal);
      return { config, data: produto, status: 200, statusText: "OK", headers: new AxiosHeaders() };
    };
    await expect(produtos.getById(1, signal)).resolves.toEqual(produto);
  });
  it.each([{}, { id: 1 }, { ...produto, marca: {} }, { ...produto, descricao: 1 }])("rejects an incomplete detail response", async (data) => {
    api.defaults.adapter = async (config) => ({ config, data, status: 200, statusText: "OK", headers: new AxiosHeaders() });
    await expect(produtos.getById(1)).rejects.toMatchObject({ code: "ERR_BAD_RESPONSE" });
  });
  it("preserves abort semantics", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(produtos.getById(1, controller.signal)).rejects.toMatchObject({ code: "ERR_CANCELED" });
  });
});
