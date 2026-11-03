import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";
import { useAuthStore } from "@/lib/auth-token";

const empresa = { id: 1, nome: "Omo", email: "omo@example.com" };

function resetMemory() {
  useAuthStore.setState({
    accessToken: null,
    user: null,
    isAuthenticated: false,
    sessionVersion: 0,
    canRefresh: true,
  });
}

describe("authentication session lifecycle", () => {
  beforeEach(() => {
    resetMemory();
    localStorage.clear();
  });

  afterEach(() => {
    resetMemory();
    localStorage.clear();
  });

  it("invalidates the previous session on logout and starts a new session on login", () => {
    useAuthStore.getState().actions.login("first-token", empresa);
    expect(useAuthStore.getState()).toMatchObject({
      accessToken: "first-token",
      user: empresa,
      isAuthenticated: true,
      sessionVersion: 1,
      canRefresh: true,
    });

    useAuthStore.getState().actions.logout();
    expect(useAuthStore.getState()).toMatchObject({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      sessionVersion: 2,
      canRefresh: false,
    });

    const otherCompany = { id: 2, nome: "Outra empresa", email: "other@example.com" };
    useAuthStore.getState().actions.login("second-token", otherCompany);
    expect(useAuthStore.getState()).toMatchObject({
      accessToken: "second-token",
      user: otherCompany,
      isAuthenticated: true,
      sessionVersion: 3,
      canRefresh: true,
    });
  });

  it("renews credentials without invalidating requests from the current session", () => {
    useAuthStore.getState().actions.login("expired-token", empresa);
    useAuthStore
      .getState()
      .actions.refresh("renewed-token", { ...empresa, nome: "Nome atualizado" });

    expect(useAuthStore.getState()).toMatchObject({
      accessToken: "renewed-token",
      user: { ...empresa, nome: "Nome atualizado" },
      isAuthenticated: true,
      sessionVersion: 1,
      canRefresh: true,
    });
  });

  it("persists only the public identity even when the access token changes", () => {
    useAuthStore.getState().actions.login("first-secret", empresa);
    useAuthStore.getState().actions.setAccessToken("replacement-secret");

    expect(useAuthStore.getState().accessToken).toBe("replacement-secret");
    expect(JSON.parse(localStorage.getItem("quimia:auth-storage")!)._versao).toBe(1);
    expect(JSON.parse(localStorage.getItem("quimia:auth-storage")!).dados).toEqual({
      user: empresa,
      isAuthenticated: true,
    });

    useAuthStore.getState().actions.logout();
    expect(JSON.parse(localStorage.getItem("quimia:auth-storage")!).dados).toEqual({
      user: null,
      isAuthenticated: false,
    });
  });

  it("restores a remembered identity into a fresh memory session without restoring credentials", async () => {
    useAuthStore.getState().actions.login("memory-only-token", empresa);
    const persisted = localStorage.getItem("quimia:auth-storage")!;
    useAuthStore.getState().actions.logout();
    resetMemory();
    localStorage.setItem("quimia:auth-storage", persisted);

    await useAuthStore.persist.rehydrate();

    expect(useAuthStore.getState()).toMatchObject({
      accessToken: null,
      user: empresa,
      isAuthenticated: true,
      sessionVersion: 0,
      canRefresh: true,
    });
  });

  it("migrates legacy identity storage and discards persisted credentials", async () => {
    resetMemory();
    localStorage.setItem(
      "quimia:auth-storage",
      JSON.stringify({
        state: { user: empresa, isAuthenticated: true, accessToken: "must-not-restore" },
        version: 0,
      }),
    );
    await useAuthStore.persist.rehydrate();
    expect(useAuthStore.getState().user).toEqual(empresa);
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(localStorage.getItem("quimia:auth-storage")).not.toContain("must-not-restore");
    expect(JSON.parse(localStorage.getItem("quimia:auth-storage")!)._versao).toBe(1);
  });

  it("discards unknown future identity versions instead of trusting authentication", async () => {
    resetMemory();
    localStorage.setItem(
      "quimia:auth-storage",
      JSON.stringify({ _versao: 99, dados: { user: empresa, isAuthenticated: true } }),
    );
    await useAuthStore.persist.rehydrate();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(localStorage.getItem("quimia:auth-storage")).toBeNull();
  });
});
