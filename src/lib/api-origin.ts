type ApiEnvironment = {
  VITE_API_URL?: string;
};

export function resolveApiOrigin(env: ApiEnvironment): string {
  const value = (env.VITE_API_URL ?? "").trim();
  if (!value) return "";

  const invalidOrigin = () =>
    new Error(
      "VITE_API_URL deve conter apenas uma origem HTTP(S), sem caminho, credenciais ou parâmetros.",
    );
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw invalidOrigin();
  }
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    url.username ||
    url.password
  ) {
    throw invalidOrigin();
  }
  return url.origin;
}
