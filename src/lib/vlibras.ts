interface VLibrasWidget {
  initBtn?: HTMLButtonElement;
  access?: HTMLElement;
  open?: () => void;
}

declare global {
  interface Window {
    VLibrasWidget?: VLibrasWidget;
  }
}

let pending: Promise<VLibrasWidget> | undefined;
let desiredVisible = false;
let visibilityGeneration = 0;
const SCRIPT_ID = "quimia-vlibras-script";

function themeButton(widget: VLibrasWidget) {
  const button = widget.initBtn;
  if (!button) return;
  button.setAttribute("aria-label", "Abrir tradutor de Libras — VLibras");
  button.title = "Traduzir para Libras com VLibras";
  const icon = document.createElement("span");
  icon.setAttribute("aria-hidden", "true");
  Object.assign(icon.style, {
    display: "block",
    width: "40px",
    height: "40px",
    backgroundColor: "currentColor",
    mask: `url("${import.meta.env.BASE_URL}icons/libras.svg") center / contain no-repeat`,
  });
  button.replaceChildren(icon);
  Object.assign(button.style, {
    background: "var(--primary-primary)",
    color: "var(--primary-foreground)",
    borderRadius: "16px",
    width: "48px",
    minWidth: "48px",
    height: "48px",
    padding: "4px",
    position: "static",
    border: "none",
  });
  if (widget.access) {
    Object.assign(widget.access.style, {
      width: "auto",
      height: "48px",
      top: "calc(50dvh - 24px)",
      right: "16px",
    });
    widget.access.querySelector<HTMLImageElement>("#vlibras-popup")?.setAttribute("hidden", "");
  }
}

export function setVLibrasVisible(visible: boolean) {
  if (desiredVisible !== visible) visibilityGeneration++;
  desiredVisible = visible;
  // This also suppresses elements inserted later by the official module's onload.
  document.documentElement.dataset.vlibrasEnabled = String(visible);
  const wrapper = document.getElementById("vlibras-access-wrapper");
  if (wrapper) wrapper.hidden = !visible;
  if (!visible) {
    const root = document.getElementById("vlibras-app-root");
    if (root) root.dataset.active = "false";
  }
}

export function loadVLibras(): Promise<VLibrasWidget> {
  if (window.VLibrasWidget?.initBtn && window.VLibrasWidget.open) {
    themeButton(window.VLibrasWidget);
    return Promise.resolve(window.VLibrasWidget);
  }
  if (pending) return pending;
  pending = new Promise<VLibrasWidget>((resolve, reject) => {
    document.getElementById(SCRIPT_ID)?.remove();
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = "https://vlibras.gov.br/app/vlibras-plugin.js";
    script.async = true;
    let poll: ReturnType<typeof setTimeout>;
    const timeout = setTimeout(() => fail(), 15_000);
    function fail() {
      clearTimeout(timeout);
      clearTimeout(poll);
      script.remove();
      pending = undefined;
      reject(
        new Error("Não foi possível carregar o VLibras. Verifique sua conexão e tente novamente."),
      );
    }
    function ready() {
      const widget = window.VLibrasWidget;
      if (!widget?.initBtn || !widget.open) {
        poll = setTimeout(ready, 50);
        return;
      }
      clearTimeout(timeout);
      themeButton(widget);
      setVLibrasVisible(desiredVisible);
      pending = undefined;
      resolve(widget);
    }
    script.onload = ready;
    script.onerror = fail;
    document.body.append(script);
  });
  return pending;
}

export async function showVLibras() {
  setVLibrasVisible(true);
  const generation = visibilityGeneration;
  const widget = await loadVLibras();
  function checkCancelled() {
    if (!desiredVisible || generation !== visibilityGeneration)
      throw new DOMException("VLibras desativado", "AbortError");
  }
  checkCancelled();
  widget.open?.();
  await new Promise<void>((resolve, reject) => {
    const deadline = Date.now() + 30_000;
    function check() {
      try {
        checkCancelled();
      } catch (error) {
        reject(error);
        return;
      }
      if (document.getElementById("vlibras-app-root")?.dataset.active === "true") resolve();
      else if (Date.now() > deadline)
        reject(new Error("O tradutor VLibras não respondeu. Tente novamente em instantes."));
      else setTimeout(check, 100);
    }
    check();
  });
}
