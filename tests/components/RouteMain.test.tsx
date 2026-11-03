import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import RouteMain from "@/components/RouteMain";
import AuthLayout from "@/components/AuthLayout";
import AuthFeedback from "@/components/AuthFeedback";
import Loading from "@/pages/Loading";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
describe("route landmarks", () => {
  it("keeps unique main targets when recovery hides the old form behind feedback", () => {
    const { container } = render(
      <>
        <div hidden>
          <AuthLayout>
            <h1>Recuperar senha</h1>
          </AuthLayout>
        </div>
        <AuthFeedback variant="error" title="Não foi possível enviar">
          <button>Tentar novamente</button>
        </AuthFeedback>
      </>,
    );
    const mains = Array.from(container.querySelectorAll("main"));
    expect(mains).toHaveLength(2);
    expect(mains[0].id).not.toBe(mains[1].id);
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getByRole("main")).toContainElement(
      screen.getByRole("button", { name: "Tentar novamente" }),
    );
    expect(container.querySelector("main main")).toBeNull();
  });

  it("keeps a loading fallback inside the route main without adding another main", () => {
    vi.stubGlobal("matchMedia", () => ({
      matches: true,
      addEventListener() {},
      removeEventListener() {},
    }));
    const { container } = render(
      <RouteMain>
        <Loading />
      </RouteMain>,
    );
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveTextContent("Carregando");
    expect(container.querySelector("main main")).toBeNull();
  });
});
