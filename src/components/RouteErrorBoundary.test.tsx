import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, it } from "vitest";
import RouteErrorBoundary from "./RouteErrorBoundary";

describe("RouteErrorBoundary", () => {
  it("shows an application fallback when a route fails", async () => {
    const router = createMemoryRouter(
      [
        {
          path: "/",
          loader: () => {
            throw new Error("Route failed");
          },
          Component: () => <p>Home</p>,
          ErrorBoundary: RouteErrorBoundary,
        },
      ],
      { initialEntries: ["/"] },
    );

    render(<RouterProvider router={router} />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Algo deu errado",
    );
    expect(screen.queryByText("Route failed")).not.toBeInTheDocument();
  });
});
