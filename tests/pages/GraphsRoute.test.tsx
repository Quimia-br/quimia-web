import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, Link, Outlet, RouterProvider } from "react-router-dom";
import { afterEach, expect, it, vi } from "vite-plus/test";
import GraphsRoute from "@/pages/GraphsRoute";

const loading = vi.hoisted(() => {
  let finish!: () => void;
  const ready = new Promise<void>((resolve) => {
    finish = resolve;
  });
  return { ready, finish };
});

vi.mock("@/pages/Graphs", async () => {
  await loading.ready;
  return { default: () => <h1>Relatórios prontos</h1> };
});
vi.mock("@/components/Header", () => ({
  default: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

afterEach(cleanup);

it("mantém a navegação montada enquanto Suspense mostra skeletons e reutiliza a página carregada", async () => {
  const router = createMemoryRouter([
    {
      element: (
        <>
          <nav aria-label="Menu">
            <Link to="/">Início</Link>
            <Link to="/graphs">Estatísticas</Link>
          </nav>
          <main>
            <Outlet />
          </main>
        </>
      ),
      children: [
        { path: "/", element: <p>Página inicial</p> },
        { path: "/graphs", Component: GraphsRoute },
      ],
    },
  ]);
  try {
    render(<RouterProvider router={router} />);
    const menu = screen.getByRole("navigation", { name: "Menu" });
    fireEvent.click(screen.getByRole("link", { name: "Estatísticas" }));
    expect(
      await screen.findByRole("region", { name: "Carregando relatórios da empresa" }),
    ).toHaveAttribute("aria-busy", "true");
    expect(screen.getAllByRole("status")).toHaveLength(6);
    expect(screen.getByRole("navigation", { name: "Menu" })).toBe(menu);
    await act(async () => {
      loading.finish();
      await loading.ready;
    });
    expect(await screen.findByRole("heading", { name: "Relatórios prontos" })).toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "Carregando relatórios da empresa" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("link", { name: "Início" }));
    expect(await screen.findByText("Página inicial")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("link", { name: "Estatísticas" }));
    expect(await screen.findByRole("heading", { name: "Relatórios prontos" })).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Menu" })).toBe(menu);
  } finally {
    router.dispose();
  }
});
