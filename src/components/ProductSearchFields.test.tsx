import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { NuqsAdapter } from "nuqs/adapters/react-router/v7";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import ProductSearchFields from "./ProductSearchFields";
import SearchBar from "./SearchBar";
import { useProductSearchFields } from "@/hooks/use-product-search-fields";

const routers: ReturnType<typeof createBrowserRouter>[] = [];
function FieldsReader() {
  const { fields, effectiveFields, setFields, clearFields } = useProductSearchFields();
  return <><output aria-label="Campos aplicados">{fields.join(",")}</output>
    <output aria-label="Campos efetivos">{effectiveFields.join(",")}</output>
    <button onClick={() => setFields(["barcode", "name", "barcode"])}>Definir campos</button>
    <button onClick={() => setFields(["name", "name"])}>Repetir campos</button>
    <button onClick={clearFields}>Limpar campos pelo hook</button></>;
}
function setup(path = "/products?q=vitamina&p=4&sort=name&tag=a&tag=b#results", extra?: React.ReactNode, disabled = false) {
  window.history.replaceState({ idx: 0, key: "fields-0" }, "", path);
  const router = createBrowserRouter([{ path: "*", element: <NuqsAdapter><ProductSearchFields disabled={disabled} /> <FieldsReader />{extra}</NuqsAdapter> }]);
  routers.push(router);
  render(<RouterProvider router={router} />);
  return router;
}
async function flush() { await act(async () => { await vi.advanceTimersByTimeAsync(100); }); }

beforeEach(() => vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"] }));
afterEach(() => { cleanup(); routers.splice(0).forEach(router => router.dispose()); vi.useRealTimers(); });

describe("ProductSearchFields", () => {
  it("starts unrestricted and selects multiple fields while retaining other URL data", async () => {
    const router = setup();
    expect(screen.getByLabelText("Campos aplicados")).toHaveTextContent("");
    expect(screen.getByLabelText("Campos efetivos")).toHaveTextContent("name,type,barcode");
    expect(screen.queryByRole("button", { name: "Limpar filtros" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Nome" }));
    await flush();
    fireEvent.click(screen.getByRole("button", { name: "Tipo" }));
    await flush();
    expect(screen.getByLabelText("Campos aplicados")).toHaveTextContent("name,type");
    expect(screen.getByRole("button", { name: "Nome" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Tipo" })).toHaveAttribute("aria-pressed", "true");
    const params = new URLSearchParams(router.state.location.search);
    expect(params.get("fields")).toBe("name,type");
    expect(params.get("q")).toBe("vitamina");
    expect(params.get("p")).toBeNull();
    expect(params.getAll("tag")).toEqual(["a", "b"]);
    expect(router.state.location.hash).toBe("#results");
  });

  it("normalizes URL values and clears without clearing q", async () => {
    const router = setup("/products?q=abc&p=3&fields=type%2Cinvalid%2Cname%2Ctype#part");
    expect(screen.getByLabelText("Campos aplicados")).toHaveTextContent("name,type");
    fireEvent.click(screen.getByRole("button", { name: "Limpar campos pelo hook" }));
    await flush();
    expect(screen.getByLabelText("Campos aplicados")).toHaveTextContent("");
    expect(screen.getByLabelText("Campos efetivos")).toHaveTextContent("name,type,barcode");
    expect(router.state.location.search).toBe("?q=abc");
    expect(router.state.location.hash).toBe("#part");
  });

  it("last removal returns to unrestricted; no-op keeps page and history", async () => {
    const router = setup("/products?p=5&fields=name");
    const before = router.state.location.key;
    fireEvent.click(screen.getByRole("button", { name: "Repetir campos" }));
    await flush();
    expect(router.state.location.key).toBe(before);
    expect(new URLSearchParams(router.state.location.search).get("p")).toBe("5");
    fireEvent.click(screen.getByRole("button", { name: "Nome" }));
    await flush();
    expect(screen.getByLabelText("Campos efetivos")).toHaveTextContent("name,type,barcode");
    expect(router.state.location.search).toBe("");
    expect(router.state.location.key).not.toBe(before);
    vi.useRealTimers();
    await act(async () => { await router.navigate(-1); });
    expect(screen.getByLabelText("Campos aplicados")).toHaveTextContent("name");
    expect(new URLSearchParams(router.state.location.search).get("p")).toBe("5");
  });

  it("canonicalizes an external hook setter and keeps fields during debounced search", async () => {
    const router = setup("/products?q=old&p=4", <SearchBar voiceEnabled={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Definir campos" }));
    await flush();
    expect(screen.getByLabelText("Campos aplicados")).toHaveTextContent("name,barcode");
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "new" } });
    await act(async () => { await vi.advanceTimersByTimeAsync(500); });
    expect(new URLSearchParams(router.state.location.search).get("fields")).toBe("name,barcode");
    expect(new URLSearchParams(router.state.location.search).get("q")).toBe("new");
  });

  it("keeps a pending search draft when a field changes before debounce", async () => {
    const router = setup("/products?q=old&p=4&sort=name&tag=a&tag=b#results", <SearchBar voiceEnabled={false} />);
    const input = screen.getByRole("searchbox");
    fireEvent.change(input, { target: { value: "new" } });
    await act(async () => { await vi.advanceTimersByTimeAsync(150); });
    fireEvent.click(screen.getByRole("button", { name: "Nome" }));
    await flush();
    expect(input).toHaveValue("new");
    expect(new URLSearchParams(router.state.location.search).get("q")).toBe("old");
    await act(async () => { await vi.advanceTimersByTimeAsync(200); });
    const params = new URLSearchParams(router.state.location.search);
    expect(params.get("q")).toBe("new");
    expect(params.get("fields")).toBe("name");
    expect(params.get("p")).toBeNull();
    expect(params.get("sort")).toBe("name");
    expect(params.getAll("tag")).toEqual(["a", "b"]);
    expect(router.state.location.hash).toBe("#results");
  });

  it("cancels a pending draft on Back even when q stays the same", async () => {
    vi.useRealTimers();
    const router = setup("/products?q=old&sort=first", <SearchBar voiceEnabled={false} />);
    await act(async () => { await router.navigate("/products?q=old&sort=second"); });
    const input = screen.getByRole("searchbox");
    fireEvent.change(input, { target: { value: "draft" } });
    await act(async () => { await router.navigate(-1); });
    expect(router.state.location.search).toBe("?q=old&sort=first");
    expect(input).toHaveValue("old");
    await act(async () => { await new Promise((resolve) => window.setTimeout(resolve, 450)); });
    expect(router.state.location.search).toBe("?q=old&sort=first");
  });

  it("supports arrow-key focus in the group", async () => {
    vi.useRealTimers();
    setup("/products?fields=name");
    const group = screen.getByRole("group", { name: "Campos da busca" });
    const name = screen.getByRole("button", { name: "Nome" });
    name.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Tipo" }));
    expect(group).toHaveAttribute("aria-describedby");
  });

  it("disables every field when controlled disabled and keeps clearing outside the composition", () => {
    const router = setup("/products?fields=name&p=3", undefined, true);
    expect(screen.getByRole("button", { name: "Nome" })).toHaveAttribute("aria-disabled", "true");
    expect(screen.queryByRole("button", { name: "Limpar filtros" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tipo" }));
    expect(router.state.location.search).toBe("?fields=name&p=3");
  });
});
