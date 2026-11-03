import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, describe, expect, it } from "vite-plus/test";
import RouteErrorBoundary from "@/pages/RouteErrorBoundary";

const routers: ReturnType<typeof createMemoryRouter>[] = [];

afterEach(() => {
  cleanup();
  routers.splice(0).forEach((router) => router.dispose());
});

function setup(error: unknown) {
  const router = createMemoryRouter(
    [
      { path: "/", element: <p>Home recuperada</p> },
      {
        path: "/failure",
        element: <p>Conteúdo da rota</p>,
        HydrateFallback: () => <p>Carregando página</p>,
        loader: () => {
          throw error;
        },
        ErrorBoundary: RouteErrorBoundary,
      },
    ],
    { initialEntries: ["/failure"] },
  );
  routers.push(router);
  render(<RouterProvider router={router} />);
}

describe("RouteErrorBoundary", () => {
  it("distinguishes a missing page and lets the user navigate home", async () => {
    setup(new Response(null, { status: 404 }));

    expect(await screen.findByRole("heading", { name: "Página não encontrada" })).toBeVisible();
    await userEvent.setup().click(screen.getByRole("link", { name: "Voltar para Home" }));
    expect(await screen.findByText("Home recuperada")).toBeVisible();
  });

  it.each([new Response(null, { status: 500 }), new Error("unexpected error")])(
    "shows recovery guidance for an unexpected route failure",
    async (error) => {
      setup(error);

      expect(await screen.findByRole("heading", { name: "Verifique sua conexão" })).toBeVisible();
      expect(
        screen.queryByRole("heading", { name: "Página não encontrada" }),
      ).not.toBeInTheDocument();
    },
  );
});
