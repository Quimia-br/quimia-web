import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Suspense, lazy } from "react";
import { createMemoryRouter, Link, RouterProvider, useSearchParams } from "react-router-dom";
import { afterEach, describe, expect, it } from "vite-plus/test";
import QueryStateLayout from "@/lib/QueryStateLayout";

const routers: ReturnType<typeof createMemoryRouter>[] = [];
afterEach(() => {
  cleanup();
  routers.splice(0).forEach((router) => router.dispose());
});

function FirstPage() {
  const [params, setParams] = useSearchParams();
  return (
    <main id="first-content" data-route-content tabIndex={-1}>
      <h1>Primeira página</h1>
      <label htmlFor="filter">Filtro</label>
      <input
        id="filter"
        value={params.get("q") ?? ""}
        onChange={(event) => setParams({ q: event.target.value })}
      />
      <Link to="/next">Próxima página</Link>
    </main>
  );
}
function NextPage() {
  return (
    <main id="next-content" data-route-content tabIndex={-1}>
      <h1>Próxima página</h1>
    </main>
  );
}
function setup(next = <NextPage />) {
  const router = createMemoryRouter(
    [
      {
        Component: QueryStateLayout,
        children: [
          { path: "/", element: <FirstPage /> },
          { path: "/next", element: next },
        ],
      },
    ],
    { initialEntries: ["/"] },
  );
  routers.push(router);
  render(<RouterProvider router={router} />);
  return router;
}

describe("route keyboard navigation", () => {
  it("offers the skip link first and moves focus into the visible main content", async () => {
    const user = userEvent.setup();
    setup();
    const skip = screen.getByRole("link", { name: "Pular para o conteúdo principal" });
    expect(skip).toHaveAttribute("href", "#first-content");
    await user.tab();
    expect(skip).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("main")).toHaveFocus();
  });

  it("moves focus after a pathname change and preserves input focus during query updates", async () => {
    const user = userEvent.setup();
    setup();
    const filter = screen.getByLabelText("Filtro");
    await user.type(filter, "limpa");
    expect(filter).toHaveValue("limpa");
    expect(filter).toHaveFocus();
    await user.click(screen.getByRole("link", { name: "Próxima página" }));
    await waitFor(() => expect(screen.getByRole("main")).toHaveFocus());
    expect(screen.getByRole("link", { name: "Pular para o conteúdo principal" })).toHaveAttribute(
      "href",
      "#next-content",
    );
  });

  it("waits for lazy content and ignores a main hidden behind error feedback", async () => {
    let resolvePage!: (value: { default: typeof NextPage }) => void;
    const DeferredPage = lazy(
      () =>
        new Promise<{ default: typeof NextPage }>((resolve) => {
          resolvePage = resolve;
        }),
    );
    const router = setup(
      <>
        <div hidden>
          <main data-route-content id="hidden-content" tabIndex={-1}>
            Formulário anterior
          </main>
        </div>
        <Suspense fallback={<div role="status">Carregando</div>}>
          <DeferredPage />
        </Suspense>
      </>,
    );
    await act(async () => {
      await router.navigate("/next");
    });
    expect(document.getElementById("hidden-content")).not.toHaveFocus();
    await act(async () => resolvePage({ default: NextPage }));
    await waitFor(() => expect(screen.getByRole("main")).toHaveFocus());
    expect(screen.getByRole("link", { name: "Pular para o conteúdo principal" })).toHaveAttribute(
      "href",
      "#next-content",
    );
  });
});
