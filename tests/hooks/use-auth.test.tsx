import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { AuthProvider } from "@/lib/auth-provider";
import { useAuth } from "@/hooks/use-auth";
import { useAuthStore } from "@/lib/auth-token";

function Session() {
  const { user, isAuthenticated } = useAuth();
  return <p>{isAuthenticated ? user?.nome : "Sessão encerrada"}</p>;
}

afterEach(() => {
  cleanup();
  useAuthStore.getState().actions.logout();
});

describe("AuthProvider", () => {
  it("distributes session changes to nested consumers without passing props", () => {
    useAuthStore.getState().actions.logout();
    render(
      <AuthProvider>
        <section>
          <Session />
        </section>
      </AuthProvider>,
    );
    expect(screen.getByText("Sessão encerrada")).toBeVisible();
    act(() =>
      useAuthStore
        .getState()
        .actions.login("memory-only", { id: 7, nome: "Empresa", email: "empresa@example.com" }),
    );
    expect(screen.getByText("Empresa")).toBeVisible();
    act(() => useAuthStore.getState().actions.logout());
    expect(screen.getByText("Sessão encerrada")).toBeVisible();
  });

  it("reports a missing provider explicitly", () => {
    expect(() => render(<Session />)).toThrow("AuthProvider");
  });
});
