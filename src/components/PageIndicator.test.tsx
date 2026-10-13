import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { NuqsAdapter } from "nuqs/adapters/react-router/v7";
import { useState, type ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";
import PageIndicator from "./PageIndicator";

const routers: ReturnType<typeof createBrowserRouter>[] = [];
afterEach(() => { cleanup(); routers.splice(0).forEach(router => router.dispose()); });

function setup(path = "/products?sort=name#results", totalPages = 5, disabled = false, element?: ReactNode) {
  window.history.replaceState({ idx: 0, key: "initial" }, "", path);
  const router = createBrowserRouter([{ path: "*", element:
    <NuqsAdapter>{element ?? <PageIndicator totalPages={totalPages} disabled={disabled} />}</NuqsAdapter>,
  }]);
  routers.push(router);
  return { router, ...render(<RouterProvider router={router} />) };
}
function currentPage(page: number, total = 5) {
  return screen.getByRole("button", { name: `Página ${page} de ${total}` });
}

describe("PageIndicator", () => {
  it("reads p from the URL and marks the current page without navigating on mount", () => {
    setup("/products?p=2&q=creatina#results");
    expect(screen.getByRole("navigation", { name: "Paginação" })).toBeInTheDocument();
    expect(currentPage(2)).toHaveAttribute("aria-current", "page");
    expect(currentPage(1)).not.toHaveAttribute("aria-current");
    expect(location.search).toBe("?p=2&q=creatina");
  });

  it("changes p and preserves search, repeated filters, path and hash", async () => {
    setup("/products?q=creatina&tag=a&tag=b#results");
    await userEvent.click(currentPage(3));
    await waitFor(() => expect(new URLSearchParams(location.search).get("p")).toBe("3"));
    expect(currentPage(3)).toHaveAttribute("aria-current", "page");
    expect(new URLSearchParams(location.search).get("q")).toBe("creatina");
    expect(new URLSearchParams(location.search).getAll("tag")).toEqual(["a", "b"]);
    expect(location.pathname).toBe("/products");
    expect(location.hash).toBe("#results");
  });

  it("removes p when returning to the first page", async () => {
    setup("/products?p=4&sort=name");
    await userEvent.click(currentPage(1));
    await waitFor(() => expect(new URLSearchParams(location.search).has("p")).toBe(false));
    expect(new URLSearchParams(location.search).get("sort")).toBe("name");
  });

  it("supports keyboard activation with native buttons", async () => {
    setup();
    const user = userEvent.setup();
    currentPage(2).focus();
    await user.keyboard(" ");
    await waitFor(() => expect(new URLSearchParams(location.search).get("p")).toBe("2"));
    expect(currentPage(2)).toHaveAttribute("type", "button");
  });

  it("restores the active page with Back and Forward", async () => {
    setup();
    await userEvent.click(currentPage(2));
    await waitFor(() => expect(new URLSearchParams(location.search).get("p")).toBe("2"));
    await userEvent.click(currentPage(3));
    await waitFor(() => expect(new URLSearchParams(location.search).get("p")).toBe("3"));
    act(() => window.history.back());
    await waitFor(() => expect(currentPage(2)).toHaveAttribute("aria-current", "page"));
    act(() => window.history.forward());
    await waitFor(() => expect(currentPage(3)).toHaveAttribute("aria-current", "page"));
  });

  it("shows every page returned by the API and navigates directly to distant pages", async () => {
    setup("/products?p=6", 12);
    expect(screen.getAllByRole("button")).toHaveLength(12);
    expect(currentPage(1, 12)).toBeInTheDocument();
    expect(currentPage(12, 12)).toBeInTheDocument();
    await userEvent.click(currentPage(12, 12));
    await waitFor(() => expect(new URLSearchParams(location.search).get("p")).toBe("12"));
    expect(currentPage(12, 12)).toHaveAttribute("aria-current", "page");
    expect(screen.getAllByRole("button")).toHaveLength(12);
  });

  it.each(["abc", "0", "-1", "2.5", "2abc", "1e2", "9007199254740992"])("repairs invalid p=%s without adding a history entry", async (value) => {
    setup(`/products?p=${value}&q=teste`);
    const length = history.length;
    expect(currentPage(1)).toHaveAttribute("aria-current", "page");
    await waitFor(() => expect(new URLSearchParams(location.search).has("p")).toBe(false));
    expect(history.length).toBe(length);
    expect(new URLSearchParams(location.search).get("q")).toBe("teste");
  });

  it("clamps a page exceeding the total returned by the API", async () => {
    setup("/products?p=99", 3);
    expect(currentPage(3, 3)).toHaveAttribute("aria-current", "page");
    await waitFor(() => expect(new URLSearchParams(location.search).get("p")).toBe("3"));
  });

  it("updates after external navigation", async () => {
    const { router } = setup("/products?p=5", 5);
    await act(async () => router.navigate("/products?p=2"));
    expect(currentPage(2)).toHaveAttribute("aria-current", "page");
    await act(async () => router.navigate("/products?p=999"));
    await waitFor(() => expect(new URLSearchParams(location.search).get("p")).toBe("5"));
  });

  it("does not navigate when disabled", async () => {
    setup("/products?p=2", 5, true);
    const length = history.length;
    fireEvent.click(currentPage(3));
    expect(location.search).toBe("?p=2");
    expect(history.length).toBe(length);
    expect(currentPage(3)).toBeDisabled();
  });

  it("preserves a saved page while API metadata is loading, then clamps when its total shrinks", async () => {
    function ApiResult() {
      const [total, setTotal] = useState(0);
      return <><PageIndicator totalPages={total} />
        <button onClick={() => setTotal(5)}>Receive five pages</button>
        <button onClick={() => setTotal(2)}>Receive two pages</button>
      </>;
    }
    setup("/products?p=4", 0, false, <ApiResult />);
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    expect(location.search).toBe("?p=4");
    await userEvent.click(screen.getByRole("button", { name: "Receive five pages" }));
    expect(currentPage(4)).toHaveAttribute("aria-current", "page");
    const length = history.length;
    await userEvent.click(screen.getByRole("button", { name: "Receive two pages" }));
    await waitFor(() => expect(new URLSearchParams(location.search).get("p")).toBe("2"));
    expect(currentPage(2, 2)).toHaveAttribute("aria-current", "page");
    expect(history.length).toBe(length);
  });

  it.each([0, 1, -1, 2.5, Number.NaN])("hides the indicator for totalPages=%s", (totalPages) => {
    setup("/products", totalPages);
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });
});
